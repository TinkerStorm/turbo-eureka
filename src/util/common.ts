// #region Imports

// Packages
import {
  AnyComponent,
  ButtonStyle,
  ComponentContext,
  ComponentType,
  ComponentActionRow,
  ComponentButton,
  ComponentSelectMenu,
  InteractionResponseFlags,
  Member,
  MessageOptions,
  User
} from 'slash-create';
import fetch from 'node-fetch';

// Packages - Parsers
import yaml from 'js-yaml';
import grayMatter from 'gray-matter';

// #endregion

export function findComponent<T extends ComponentButton | ComponentSelectMenu>(
  components: AnyComponent[],
  id: string
): T | undefined {
  const [rowIndex, componentIndex] = findComponentPosition(components, id);

  if (rowIndex === -1 || componentIndex === -1) return undefined;

  return (components[rowIndex] as ComponentActionRow).components[componentIndex] as T;
}

export function findComponentPosition(components: AnyComponent[], id: string): [number, number] | undefined {
  for (let i = 0; i < components.length; i++) {
    const row = components[i];
    if (row.type !== ComponentType.ACTION_ROW) continue;
    for (let j = 0; j < row.components.length; j++) {
      const component = row.components[j];
      if ('url' in component) return;
      if (component.type === ComponentType.TEXT_INPUT) return;
      if (component.custom_id.startsWith(id)) {
        return [i, j];
      }
    }
  }
}

export function shiftIf<T>(arr: T[], condition: (item: T) => boolean = () => true, shift: number = 0): T {
  const index = arr.findIndex(condition);
  if (index >= 0) {
    return arr.splice(index + shift, 0)[0];
  }
  return undefined;
}

export function parseFileContent(input: string, fileType: string): MessageOptions {
  switch (fileType) {
    // Future support for gray-matter on channel-backup?
    case 'md': {
      const result = grayMatter(input);

      return { ...result.data, content: result.content };
    }
    case 'json':
      return JSON.parse(input);
    case 'yaml':
    case 'yml':
      return yaml.load(input);
    default:
      throw new Error(`Unknown file type: ${fileType}`);
  }
}

/**
 * If roles is empty, it should return true.
 * Else, it should return true if the member has all the roles.
 *
 * *i.e. no roles means there should be nothing to hide.*
 *
 * @param member The member to check
 * @param roles The roles to check for
 */
export function memberHasRoles(member: Member, roles: string[]) {
  if ('length' in roles && roles.length === 0) return true;
  return roles.every((role) => member.roles.includes(role));
}

/**
 * Fetch a file from GitHub's raw endpoint, repo is expected to be public.
 * @param repo The repository name, in the format of `owner/repo`.
 * @param branch The branch name.
 * @param path The path to the file.
 * @returns
 */
export function fetchFromGitHub(repo: string, branch: string, path: string) {
  return fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${path}`);
}

/**
 * This ensures that the partial message data is filled with any missing values.
 * * While some messages rely on the use of partial references in part with Discord's API, this becomes a problem when there is nothing to compare against as an option to decide if that operation should be done.
 *
 * Fill empty values in an object with the values from another object.
 * @param target The target object to amend.
 * @param source The source object to amend from.
 * @returns
 */

export function resolveMessage(ctx: ComponentContext, target: MessageOptions) {
  const { message: source } = ctx.data;

  if (!('content' in target) && target.content !== null && source.content) target.content = '';
  if (!('embeds' in target) && target.embeds !== null && source.embeds) target.embeds = [];
  if (!('components' in target) && target.components !== null && source.components) target.components = [];

  const errors: string[] = [];

  for (const index in target.components) {
    const components = target.components[index];

    target.components[index].components = components.components.map(
      (component: ComponentButton | ComponentSelectMenu, componentIndex: number) => {
        if (![ComponentType.BUTTON, ComponentType.STRING_SELECT].includes(component.type)) {
          return component as ComponentSelectMenu;
        }

        // If the component is a button, we need to check if it's a link button.
        // They cannot have a custom_id, so that needs to be returned as is.
        if ('url' in component) return component;

        const errorPrefix = `Component ${index}.${componentIndex} (${component.custom_id}) -`;

        const restrictions = (component.custom_id ?? '').split('&').slice(1);
        const disabled = component.disabled ?? !memberHasRoles(ctx.member, restrictions);

        if (component.type === ComponentType.BUTTON) {
          if (!component.style) {
            errors.push(`${errorPrefix} ~.style is missing.`);
          }

          if (!component.label && !component.emoji) {
            errors.push(`${errorPrefix} ~.label / ~.emoji are missing.`);
          }
        } else if (component.type === ComponentType.STRING_SELECT) {
          if (component.custom_id.startsWith('pick-role')) {
            component.options = component.options.map((option) => {
              const isDefault = option.default ?? memberHasRoles(ctx.member, [option.value]);
              return { ...option, default: isDefault };
            });

            if (component.max_values > component.options.length)
              errors.push(
                `${errorPrefix} ~.max_values (${component.max_values}) is greater than the number of ~.options (${component.options.length}).`
              );

            if (component.min_values > component.max_values)
              errors.push(
                `${errorPrefix} ~.min_values (${component.min_values}) is greater than ~.max_values (${component.max_values}).`
              );
          }

          if (component.custom_id.startsWith('pick-msg')) {
            // forcing both to the constant of 1, ensuring that a value is always selected.
            component.max_values &&= 1;
            component.min_values &&= 1;
          }
        }

        return {
          ...component,
          ...(component.type === ComponentType.BUTTON && {
            style: component.style ?? ButtonStyle.PRIMARY
          }),
          disabled
        };
      }
    );
  }

  if (errors.length > 0)
    throw new Error(`There were ${errors.length} errors while resolving the message.\n${errors.join('\n')}`);

  // Ensure no message outside of an ephemeral context can be edited.
  target.flags ??= source.flags ?? 0;
  if (!(target.flags & InteractionResponseFlags.EPHEMERAL)) {
    target.flags |= InteractionResponseFlags.EPHEMERAL;
    target.ephemeral = true;
  }

  return target;
}

/**
 * @param ctx The context of the interaction.
 * @param roles The roles to update.
 * @returns
 */
export function editMemberRoles(ctx: ComponentContext, roles: string[]) {
  const { guildID, member } = ctx;

  const route = `/guilds/${guildID}/members/${member.user.id}`;

  return ctx.creator.requestHandler.request('PATCH', route, true, {
    roles
  });
}

export function hashMapToString(map: Record<string, unknown>, join = '=', separate = ', ') {
  return Object.entries(map)
    .filter(([, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
    .map(([key, value]) => key + join + JSON.stringify(value))
    .join(separate);
}

export const undi = (user: User) => `${user.username}#${user.discriminator} (${user.id})`;

export function trimUntil(length: number, str: string, suffix = '...', splitBy?: string) {
  if (str.length <= length) return str;

  if (splitBy) {
    while (str.length > length) {
      str = str.slice(0, str.lastIndexOf(splitBy));
    }
  } else {
    str = str.slice(0, length);
  }

  return str + suffix;
}


export const randomRangeColor = (range: number, filler: number): number => {
  if (range * filler !== 0xffffff)
    throw new RangeError(`range (${range}) and filler (${filler}) do not equal the max color range (${0xffffff})`);

  return Math.floor(Math.random() * range) * filler;
};

export const random8BitColor = () => randomRangeColor(255, 65535);
export const random16BitColor = () => randomRangeColor(65535, 255);
export const random24BitColor = () => randomRangeColor(16769025, 1);
