// #region Imports

// Packages
import { ComponentContext, EditMessageOptions, MessageOptions } from 'slash-create';
import { hashMapToString, trimUntil, undi } from '../util/common';

// Local
import errorHashing from '../util/error-hashing';
import logger from '../util/logger';
import { PatternComponent } from '../util/PatternComponent';

// #endregion

export default async (ctx: ComponentContext) => {
  if (errorHashing.isLocked(ctx)) {
    return ctx.send('Error lockout in effect, contact an engineer to unlock.', { ephemeral: true });
  }

  const trigger = PatternComponent.registeredPatterns.find(
    (instance) => (instance.type ? ctx.componentType === instance.type : true) && instance.pattern.test(ctx.customID)
  );

  const holder = `${ctx.guildID ? `${ctx.guildID}/` : ''}${ctx.channelID}/${ctx.message.id}`;

  if (trigger) {
    const logData = trigger.logHook?.(ctx);

    logger.info(`${undi(ctx.user)} (${holder}) = $${trigger.command} ${hashMapToString(logData)}`);

    try {
      const result = await trigger.method(ctx);

      if (!result) {
        ctx.acknowledge();
        return;
      }

      if (result.embeds) {
        result.embeds = result.embeds.map((embed) => {
          if (embed.timestamp && typeof embed.timestamp !== 'string') {
            embed.timestamp = new Date(Number(embed.timestamp) * 1000);
          }

          return embed;
        });
      }

      if ('ephemeral' in result && result.ephemeral) {
        if (ctx.initiallyResponded && !ctx.deferred) {
          await ctx.sendFollowUp(result as MessageOptions);
          return;
        }

        await ctx.send(result as MessageOptions);
        return;
      }

      await ctx.editParent(result as EditMessageOptions);
      return;
    } catch (e) {
      const [hash, { message, invocations }] = errorHashing.addError(ctx, e);

      const [origin, errorHash] = hash.split('-');
      return ctx.send({
        content: [
          `An error occurred while processing your request. Please report this error to the bot owner:`,
          `> Origin: ${origin}`,
          `> Hash: \`${errorHash}\``
        ].join('\n'),
        ephemeral: true,
        embeds: [
          {
            author: {
              name: `${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id})`,
              icon_url: ctx.user.avatarURL
            },
            title: 'Developer Information',
            fields: [
              {
                name: 'Origin',
                value: `\`\`\`json\n${JSON.stringify(origin, null, 2)}\`\`\``
              },
              {
                name: 'Message',
                value: trimUntil(1024, message, '...', '\n'),
                inline: true
              },
              invocations.length > 0
                ? {
                    name: 'Invocations',
                    inline: true,
                    value: `This has been invoked an additional ${
                      invocations.length
                    } times. The most recent invocation was at <t:${Math.floor(
                      invocations[invocations.length - 1].timestamp / 1000
                    )}:F>.`
                  }
                : {
                    name: 'Invocations',
                    inline: true,
                    value: 'No additional invocations found.'
                  }
            ]
          }
        ]
      });
    }
  } else {
    logger.warn(`${undi(ctx.user)} (${holder}) ~ ${ctx.customID}`);
    await ctx.send({
      content: 'Invalid component interaction.',
      ephemeral: true
    });
  }
};
