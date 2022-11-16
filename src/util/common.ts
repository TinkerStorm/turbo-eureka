// #region Imports

// Node
import { inspect } from 'node:util';

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
      if (![ComponentType.BUTTON, ComponentType.STRING_SELECT].includes(component.type)) return;
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

  if (!target.content && source.content) target.content = '';
  if (!target.embeds && source.embeds) target.embeds = [];
  if (!target.components && source.components) target.components = [];

  for (const index in target.components) {
    const component = target.components[index];

    target.components[index].components = component.components.map(
      (component: ComponentButton | ComponentSelectMenu) => {
        if (![ComponentType.BUTTON, ComponentType.STRING_SELECT].includes(component.type)) {
          return component as ComponentSelectMenu;
        }

        // If the component is a button, we need to check if it's a link button.
        // They cannot have a custom_id, so that needs to be returned as is.
        if ('url' in component) return component;

        const restrictions = (component.custom_id ?? '').split('&').slice(1);
        const disabled = component.disabled ?? !memberHasRoles(ctx.member, restrictions);

        if (component.type === ComponentType.STRING_SELECT) {
          if (component.custom_id.startsWith('pick-role')) {
            component.options = component.options.map((option) => {
              const isDefault = option.default ?? memberHasRoles(ctx.member, [option.value]);
              return { ...option, default: isDefault };
            });
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

  // Ensure no message outside of an ephemeral context can be edited.
  target.flags ??= source.flags ?? 0;
  if (!(source.flags & InteractionResponseFlags.EPHEMERAL)) {
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
