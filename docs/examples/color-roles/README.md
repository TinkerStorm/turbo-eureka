# Color Roles

This is an example of an ephemeral role selection that can be used to 'remember' roles that were selected. Making use of `btn-msg` and `pick-role` triggers, for a more detailed explanation of these triggers, see the [Triggers](../triggers#readme) documentation.

- [Prompt](./prompt.yaml)
  > This is the entry point for the example.
- [Selection](./selection.yaml)

## Setup

There are a few options for setting up this example.

> If a webhook is used, it must be owned by the application that will be used to respond to the components.

1. Use a request sandbox like [Postman](https://www.postman.com/) to send the `prompt.yaml` (with the request body encoded as JSON) to the channel.
2. Use [channel-backup](https://github.com/TinkerStorm/channel-backup) to send the content as is, using the webhook provided.
3. Use a bot token in a request sandbox (see `1.`).
   > This will require use of your own application and bot user. Please refer to the [Discord Developer Portal](https://discord.dev) for more information.
