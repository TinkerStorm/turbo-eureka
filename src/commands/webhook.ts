// #region Imports

// Packages
import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';

// #endregion

export default class WebhookCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'webhook',
      description: 'Manage webhooks for this server',
      requiredPermissions: ['MANAGE_WEBHOOKS'],
      options: [
        {
          name: 'create',
          description: 'Create a webhook',
          type: CommandOptionType.SUB_COMMAND,
          options: [
            {
              name: 'name',
              description: 'The name of the webhook',
              type: CommandOptionType.STRING,
              required: true
            },
            {
              name: 'channel',
              description: 'The channel to create the webhook in',
              type: CommandOptionType.CHANNEL,
              required: false
            }
          ]
        },
        {
          name: 'delete',
          description: 'Delete a webhook',
          type: CommandOptionType.SUB_COMMAND,
          options: [
            {
              name: 'id',
              description: 'The ID of the webhook',
              type: CommandOptionType.STRING,
              required: true
            }
          ]
        },
        {
          name: 'list',
          description: 'List all webhooks (owned by the bot).',
          type: CommandOptionType.SUB_COMMAND
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    const [command] = ctx.subcommands;
    const options = ctx.options[command];

    console.log(ctx.appPermissions.toArray());

    if (!ctx.appPermissions.has('MANAGE_WEBHOOKS')) {
      return ctx.send('I do not have the `MANAGE_WEBHOOKS` permission.');
    }

    switch (command) {
      case 'create': {
        const { name, channel = ctx.channelID } = options;

        const webhook = await this.creator.requestHandler.request('POST', `/channels/${channel}/webhooks`, true, {
          name
        });

        return {
          embeds: [
            {
              title: 'Webhook created',
              description: [
                `**Name:** ${webhook.name}`,
                `**ID:** ${webhook.id}`,
                `**Channel:** <#${webhook.channel_id}>`,
                `**URL:** ||https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}||`,
                '> Only show the URL to people you trust, as it can be used to send messages you may not want in your server.'
              ].join('\n')
            }
          ],
          ephemeral: true
        };
      }

      case 'delete': {
        const { id } = options;
        const webhook = await this.creator.requestHandler.request('GET', `/webhooks/${id}`, true).catch(() => null);

        if (!webhook) {
          return {
            embeds: [
              {
                title: 'Webhook not found',
                description: 'The webhook you provided does not exist.'
              }
            ],
            ephemeral: true
          };
        }

        if (webhook.guild_id !== ctx.guildID) {
          return {
            embeds: [
              {
                title: 'Error',
                description: 'That webhook does not belong to this server.'
              }
            ],
            ephemeral: true
          };
        }

        await this.creator.requestHandler.request(
          'DELETE',
          `/webhooks/${id}`,
          true,
          null,
          null,
          'Requested by ' + ctx.user.username + '#' + ctx.user.discriminator
        );
        break;
      }

      case 'list': {
        const webhooks = await this.creator.requestHandler.request('GET', `/guilds/${ctx.guildID}/webhooks`, true);

        console.log(webhooks);

        const filteredWebhooks = webhooks.filter(
          (webhook) => webhook.application_id === this.creator.options.applicationID
        );

        return {
          embeds: [
            {
              title: 'Webhooks',
              description: filteredWebhooks
                .map(
                  (webhook) =>
                    `**${webhook.name}** in <#${webhook.channel_id}> - ||https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}||`
                )
                .join('\n')
            }
          ],
          ephemeral: true
        };
      }
    }
  }
}
