// #region Imports

// Packages
import { CommandContext, CommandOptionType, MessageOptions, SlashCommand, SlashCreator } from 'slash-create';

// Local
import errorHashing from '../util/error-hashing';

// #endregion

export default class ErrorManagement extends SlashCommand {
  invocationColorMap: Record<number, number>;
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'error',
      description: 'Error management',
      options: [
        {
          name: 'get',
          description: 'Get error',
          type: CommandOptionType.SUB_COMMAND,
          options: [
            {
              name: 'hash',
              description: 'Error hash',
              type: CommandOptionType.STRING,
              required: true
            },
            {
              name: 'origin',
              description: 'Error origin (either user ID or guild ID)',
              type: CommandOptionType.STRING,
              required: true
            }
          ]
        },
        {
          name: 'all',
          description: 'List all errors for one origin (messages and hashes only).',
          type: CommandOptionType.SUB_COMMAND,
          options: [
            {
              name: 'origin',
              description: 'Error origin (either user ID or guild ID)',
              type: CommandOptionType.STRING,
              required: true
            }
          ]
        },
        {
          name: 'clear',
          description: 'Clear errors',
          type: CommandOptionType.SUB_COMMAND,
          options: [
            {
              name: 'type',
              description: 'Origin type',
              type: CommandOptionType.STRING,
              required: true,
              choices: [
                {
                  name: 'User',
                  value: 'user'
                },
                {
                  name: 'Guild',
                  value: 'guild'
                }
              ]
            },
            {
              name: 'origin',
              description: 'Error origin (either user ID or guild ID)',
              type: CommandOptionType.STRING,
              required: false
            }
          ]
        },
        {
          name: 'wipe',
          description: 'Wipe all errors',
          type: CommandOptionType.SUB_COMMAND
        }
      ],
      requiredPermissions: ['ADMINISTRATOR'],
      guildIDs: [process.env.HOME_GUILD_ID],
      forcePermissions: true,
      dmPermission: false
    });

    // 0 to 5
    this.invocationColorMap = {
      0: 0x00ff00,
      1: 0x00ff00,
      2: 0x00ff00,
      3: 0xffff00,
      4: 0xff0000,
      5: 0xff0000
    };
  }

  onError(err: Error, ctx: CommandContext): void {
    console.error(err);
    ctx.send(`An error occurred: ${err.message}`);
  }

  async run(ctx: CommandContext): Promise<MessageOptions> {
    const [command] = ctx.subcommands;
    const options = ctx.options[command];

    const { origin } = options;

    switch (command) {
      case 'get': {
        const { hash } = options;

        const error = await errorHashing.getError(`${origin}-${hash}`);

        if (!error) {
          return {
            content: 'Error not found.',
            ephemeral: true
          };
        }

        return {
          embeds: [
            {
              // change color based on invocation quantity
              color: this.invocationColorMap[error.invocations.length],
              title: 'Error',
              description: `\`\`\`json\n${error.stack}\n\`\`\``,
              fields: [
                {
                  name: 'Hash',
                  value: hash,
                  inline: true
                },
                {
                  name: 'Origin',
                  value: [
                    `User: <@${error.origin.user}>`,
                    `Channel: <#${error.origin.channel}>`,
                    `Guild: ${error.origin.guild}`
                  ].join('\n'),
                  inline: true
                },
                {
                  name: 'Timestamp',
                  value: `<t:${Math.floor(error.timestamp / 1000)}:F>`,
                  inline: true
                },
                {
                  name: 'Invocations',
                  value:
                    error.invocations.length > 0
                      ? error.invocations
                          .map((invocation) => {
                            return `<@${invocation.user}> - <t:${Math.floor(invocation.timestamp / 1000)}:F>`;
                          })
                          .join('\n')
                      : 'No additional invocations.'
                }
              ]
            }
          ],
          ephemeral: true
        };
      }

      case 'all': {
        const errors = errorHashing.getAllErrorsBy(origin);

        if (!errors.length) {
          return {
            content: 'No errors found.',
            ephemeral: true
          };
        }

        return {
          embeds: [
            {
              title: `Errors for ${origin}`,
              fields: errors
                .map(([hash, { message }]) => ({
                  name: hash,
                  value: message
                }))
                .slice(0, 25)
            }
          ]
        };
      }

      case 'clear': {
        const { type } = options;

        switch (type) {
          case 'user': {
            const errors = errorHashing.getAllErrorsBy(ctx.user.id);

            if (!errors.length) {
              return {
                content: 'No errors found.',
                ephemeral: true
              };
            }

            for (const [hash] of errors) {
              errorHashing.removeError(hash);
            }

            return {
              content: `Cleared all errors for <@${ctx.user.id}> (user).`,
              ephemeral: true
            };
          }

          case 'guild': {
            const errors = errorHashing.getAllErrorsBy(ctx.guildID);

            if (!errors.length) {
              return {
                content: 'No errors found.',
                ephemeral: true
              };
            }

            for (const [hash] of errors) {
              errorHashing.removeError(hash);
            }

            return {
              content: `Cleared all errors for ${ctx.guildID} (guild).`,
              ephemeral: true
            };
          }

          default: {
            return {
              content: 'Invalid type.',
              ephemeral: true
            };
          }
        }
      }

      case 'wipe': {
        errorHashing.clear();
        return {
          embeds: [
            {
              title: 'Cleared errors',
              description: 'All errors have been cleared.',
              color: 0x00ff00,
              timestamp: new Date()
            }
          ]
        };
      }
    }
  }
}
