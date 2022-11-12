import { PatternComponent } from '../util/PatternComponent';

const pattern = /^button-role:(\d{17,21})((&\d{17,21})*)$/;

export default new PatternComponent('button-role').withPattern(pattern).withMethod(async (ctx) => {
  if (!ctx.guildID) {
    return {
      content: 'This component can only be used in a server.',
      ephemeral: true
    };
  }

  const matches = ctx.customID.match(pattern);
  if (!matches) {
    throw new Error(`Invalid custom ID (${ctx.customID} - ${pattern.source})`);
  }

  const roleID = matches[1];
  const restrictions = matches[2].split('&').filter((r) => r.length > 0);
  // button-role:1&2&3&4 -> [<full-match>, '1', '2', '3', '4']

  // Determine if the member has all the required roles from the custom ID
  const hasAllRoles = restrictions.every((role) => ctx.member.roles.includes(role));

  const { roles } = ctx.member;

  if (restrictions.length > 0 && !hasAllRoles) {
    // If the member doesn't have all the roles, determine if they have the role from the button
    const index = roles.indexOf(roleID);

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
  const action = roles.includes(roleID) ? 'removed' : 'added';
  if (action === 'added') roles.push(roleID);
  else roles.splice(roles.indexOf(roleID), 1);

  await ctx.creator.requestHandler.request('PATCH', `/guilds/${ctx.guildID}/members/${ctx.user.id}`, true, {
    roles
  });

  return {
    content: `I have ${action} the <@&${roleID}> role to you.`,
    allowedMentions: {
      everyone: false,
      roles: [roleID]
    },
    ephemeral: true
  };
});
