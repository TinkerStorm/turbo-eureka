import { ComponentSelectMenu } from 'slash-create';
import { findComponent } from '../util/common';
import { PatternComponent } from '../util/PatternComponent';

export default new PatternComponent('select-menu')
  .withPattern(/^select-menu((?:&\d{17,21})*)$/)
  .withMethod(async (ctx) => {
    if (!ctx.guildID) {
      return {
        content: 'This component can only be used in a server.',
        ephemeral: true
      };
    }

    const restrictions = ctx.customID
      .split('&')
      .slice(1)
      .filter((r) => r.length > 0);
    // select-menu&1&2&3 -> ['1', '2', '3']

    // Determine if the member has all the required roles from the custom ID
    const hasAllRoles = restrictions.every((role) => ctx.member.roles.includes(role));
    const menu = findComponent<ComponentSelectMenu>(ctx.message.components, ctx.customID);
    if (restrictions.length > 0 && !hasAllRoles) {
      // If the member doesn't have all the roles, determine if they have any roles from the menu selection
      const hasAnyRoles = menu.options.some((role) => ctx.member.roles.includes(role.value));
      if (hasAnyRoles) {
        // Remove roles
        const { roles } = ctx.member;

        for (const role of menu.options) {
          if (roles.includes(role.value)) {
            roles.splice(roles.indexOf(role.value), 1);
          }
        }

        await ctx.creator.requestHandler.request('PATCH', `/guilds/${ctx.guildID}/members/${ctx.user.id}`, true, {
          roles
        });
      }

      // if (ctx.message.flags & 6) {
      //  // Ephemeral
      //  const components = ctx.message.components.map<ComponentActionRow>((component: ComponentActionRow) => {
      //    if (component.type === ComponentType.ACTION_ROW) {
      //      for (const option of component.components) {
      //        if (option.type === ComponentType.STRING_SELECT && option.custom_id === ctx.customID) {
      //          option.disabled = true;
      //        }
      //      }
      //    }

      //    return component;
      //  });
      //  ctx.editParent({ components });
      // }

      return {
        content: 'You do not have the required roles to select this option.',
        ephemeral: true
      };
    }

    // Add, toggle roles

    const { roles } = ctx.member;

    const actions = {
      added: [],
      removed: []
    };

    for (const role of menu.options) {
      if (ctx.values.includes(role.value) && roles.includes(role.value)) {
        // No change - role should remain, ignore any environment changes (if they somehow occur)
        continue;
      }

      if (roles.includes(role.value)) {
        roles.splice(roles.indexOf(role.value), 1);
        actions.removed.push(role.value);
      } else {
        roles.push(role.value);
        actions.added.push(role.value);
      }
    }

    await ctx.creator.requestHandler.request('PATCH', `/guilds/${ctx.guildID}/members/${ctx.user.id}`, true, {
      roles
    });

    return {
      content: 'Roles updated.',
      ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: [...actions.added, ...actions.removed]
      },
      embeds: [
        {
          title: 'Roles updated',
          fields: [
            {
              name: 'Added',
              value: actions.added.length ? `<@&${actions.added.join('>\n<@&')}>` : 'None',
              inline: true
            },
            {
              name: 'Removed',
              value: actions.removed.length ? `<@&${actions.removed.join('>\n<@&')}>` : 'None',
              inline: true
            }
          ]
        }
      ]
    };
  });
