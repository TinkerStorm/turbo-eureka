// #region Imports

// Packages
import { ComponentSelectMenu, ComponentType } from 'slash-create';

// Local
import { findComponent, memberHasRoles } from '../util/common';
import { PatternComponent } from '../util/PatternComponent';

// #endregion

export default new PatternComponent('pick-role')
  .requireComponent(ComponentType.STRING_SELECT)
  .withPattern(/^pick-role((?:&\d{17,21})*)$/)
  .withMethod(async (ctx) => {
    if (!ctx.guildID) {
      return {
        content: 'This component can only be used in a server.',
        ephemeral: true
      };
    }

    if (!ctx.appPermissions.has('MANAGE_ROLES')) {
      throw new Error('I do not have the `Manage Roles` permission.');
    }

    const restrictions = ctx.customID
      .split('&')
      .slice(1)
      .filter((r) => r.length > 0);
    // select-menu&1&2&3 -> ['1', '2', '3']

    const menu = findComponent<ComponentSelectMenu>(ctx.message.components, ctx.customID);

    // Determine if the member has all the required roles from the custom ID
    if (!memberHasRoles(ctx.member, restrictions)) {
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

      if (ctx.values.includes(role.value)) {
        roles.push(role.value);
        actions.added.push(role.value);
      } else {
        roles.splice(roles.indexOf(role.value), 1);
        actions.removed.push(role.value);
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
