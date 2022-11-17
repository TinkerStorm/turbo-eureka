# turbo-eureka

A bot for handling roles through message components on webhooks (utilizes encoded state).

> Functionality is derived from the [Discohook Utils](https://dutils.shay.cat/) extension service, but is not affiliated with it.
>
> The only aspect that is derived from Discohook Utils is webhook creation, which Discord does not handle natively for bots using interactions.

## Setup

### Add the bot

A public instance is hosted on [Railway](https://railway.app?referralCode=sudojunior) and can be invited [here](https://discord.com/api/oauth2/authorize?client_id=1041078465274847312&permissions=275683526656&scope=applications.commands%20bot) or via it's Discord profile.

### Self-hosting

| Key | Description |
| --- | ----------- |
| `DISCORD_APP_ID` | The application ID of the service. |
| `DISCORD_BOT_TOKEN` | The application user token. |
| `DISCORD_PUBLIC_KEY` | The public key of the service. |
| `HOME_GUILD_ID` | The home guild of the service (used for `/error *`). |
| `NODE_NO_WARNINGS` | Disable warnings originating from Node modules (`1` to disable). |
| `PORT` | The port to host the app on. |

The endpont is hosted at `https://localhost:8020/interactions`

- If it is development build, open a tunnel using a service 
- SaaS like Railway and Azure will use the `PORT` env var to establish their own tunnel from a generated or selected domain.

## Documentation

- [Commands](./docs/commands.md)
- [Examples](./docs/examples)
- [Triggers](./docs/triggers#readme)
