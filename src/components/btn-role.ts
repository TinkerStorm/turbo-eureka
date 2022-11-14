// #region Imports

// Packages
import { ComponentType } from 'slash-create';

// Local
import { PatternComponent } from '../util/PatternComponent';
import { memberHasRoles } from '../util/common';

// #endregion

function deconstructInput(input: string) {
  const segments = input.split(/[:&]/g);

  const role = segments[1];
  const restrictions = segments.slice(2).filter((r) => r.length > 0);

  return { role, restrictions };
}

export default new PatternComponent('btn-role')
  .requireComponent(ComponentType.BUTTON)
  .withPattern(/^btn-role:(\d{17,21})((?:&\d{17,21})*)$/)
  .withMethod(async (ctx) => {
    if (!ctx.guildID) {
      return {
        content: 'This component can only be used in a server.',
        ephemeral: true
      };
    }

    const { role, restrictions } = deconstructInput(ctx.customID);
    // button-role:1&2&3&4 -> [<full-match>, '1', '2', '3', '4']

    if (!role) {
      throw new Error(`Invalid role match (${role})`);
    }

    const { roles } = ctx.member;

    // Determine if the member has all the required roles from the custom ID
    if (!memberHasRoles(ctx.member, restrictions)) {
      // If the member doesn't have all the roles, determine if they have the role from the button
      const index = roles.indexOf(role);

      if (index >= 0) {
        // Remove role
        roles.splice(index, 1);

        await ctx.creator.requestHandler.request('PATCH', `/guilds/${ctx.guildID}/members/${ctx.user.id}`, true, {
          roles
        });

        return {
          content: 'You do not have the required roles to select this option.',
          ephemeral: true
        };
      }
    }

    // Add, toggle roles
    const action = roles.includes(role) ? 'removed' : 'added';
    if (action === 'added') roles.push(role);
    else roles.splice(roles.indexOf(role), 1);

    await ctx.creator.requestHandler.request('PATCH', `/guilds/${ctx.guildID}/members/${ctx.user.id}`, true, {
      roles
    });

    return {
      content: `I have ${action} the <@&${role}> role to you.`,
      allowedMentions: {
        everyone: false,
        roles: [role]
      },
      ephemeral: true
    };
  });
