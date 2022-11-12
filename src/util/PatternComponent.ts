import { ComponentContext, ComponentType, EditMessageOptions, MessageOptions, SlashCreator } from 'slash-create';
import errorHashing from './error-hashing';

type PatternCallback = (ctx: ComponentContext) => Promise<MessageOptions | EditMessageOptions | void>;

interface PatternData {
  command: string;
  pattern?: RegExp;
  method: PatternCallback;
  type?: ComponentType;
}

export class PatternComponent {
  static hasRegisteredListener = false;
  static registeredPatterns: PatternData[] = [];

  data: PatternData;

  constructor(command: string) {
    this.data = {
      command,
      method: async (ctx) => {
        await ctx.acknowledge();
      }
    };
  }

  public withPattern(pattern: RegExp) {
    this.data.pattern = pattern;
    return this;
  }

  public withMethod(method: PatternCallback) {
    this.data.method = method;
    return this;
  }

  public requireComponent(type: ComponentType) {
    this.data.type = type;
    return this;
  }

  public register(creator: SlashCreator) {
    if (!PatternComponent.hasRegisteredListener) {
      creator.on('componentInteraction', async (ctx) => {
        if (this.data.type && ctx.componentType !== this.data.type) {
          return ctx.send('Invalid component type.', { ephemeral: true });
        }

        if (errorHashing.isLocked(ctx)) {
          return ctx.send('Error lockout in effect, contact an engineer to unlock.', { ephemeral: true });
        }

        console.log(ctx.customID);

        const pattern = PatternComponent.registeredPatterns.find((instance) =>
          ctx.customID.startsWith(instance.command)
        );
        if (pattern && pattern.pattern && pattern.pattern.test(ctx.customID)) {
          console.log('Matched pattern', pattern.command);

          try {
            const result = await pattern.method(ctx);

            if (!result) {
              return;
            }

            if (ctx.initiallyResponded && !ctx.deferred) {
              return; // If the method already responded, no further action is needed
            }

            if (result.embeds) {
              result.embeds = result.embeds.map((embed) => {
                if (embed.timestamp && typeof embed.timestamp !== 'string') {
                  embed.timestamp = new Date(Number(embed.timestamp) * 1000);
                }

                return embed;
              });
            }

            if ('ephemeral' in result && (result as MessageOptions).ephemeral) {
              return ctx.send(result as MessageOptions);
            }

            await ctx.editParent(result as EditMessageOptions);
          } catch (e) {
            const [hash, { message, invocations }] = errorHashing.addError(ctx, e);

            const [origin, errorHash] = hash.split('-');
            return ctx.send({
              content: [
                `An error occurred while processing your request. Please report this error to the bot owner: \`${hash}\``,
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
                      value: message,
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
          return {
            content: 'Invalid component interaction.',
            ephemeral: true
          };
        }
      });

      PatternComponent.hasRegisteredListener = true;
    }

    PatternComponent.registeredPatterns.push(this.data);
  }
}
