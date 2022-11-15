// #region Imports

// Packages
import { ComponentSelectMenu, ComponentType } from 'slash-create';

// Local
import { editMemberRoles, findComponent, memberHasRoles } from '../util/common';
import { PatternComponent } from '../util/PatternComponent';

// #endregion

export default new PatternComponent('pick-role')
  .requireComponent(ComponentType.STRING_SELECT)
  .withPattern(/^pick-role((?:&\d{17,21})*)$/)
  .withLogHook(({ values }) => ({ values }))
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
      const didSelectRole = ctx.values.includes(role.value);
      const roleIndex = roles.indexOf(role.value);

      if (didSelectRole && roleIndex > -1) continue;

      if (didSelectRole) {
        roles.push(role.value);
        actions.added.push(role.value);
      } else if (roleIndex > -1) {
        roles.splice(roleIndex, 1);
        actions.removed.push(role.value);
      }
    }

    await editMemberRoles(ctx, roles);

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
