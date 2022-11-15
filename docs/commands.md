# Commands

## `/webhook`

- `/webhook create name: string; channel?: Channel` - Creates a webhook with the given name.
- `/webhook delete id: string` - Deletes the webhook with the given ID.
- `/webhook list` - Lists all webhooks in the current channel.

## `/error`

*Home guild only, used for debugging and runtime safety against ratelimits.*

- `/error get hash: string; origin: string` - Gets the error with the given hash from the given origin.
- `/error all origin: string` - Lists all errors from the given origin.
- `/error clear origin: string` - Clears all errors from the given origin.
- `/error wipe` - Clears all errors from memory.
