# turbo-eureka

A bot for handling roles through message components on webhooks (utilizes encoded state).

> Functionality is derived from the [Discohook Utils](https://dutils.shay.cat/) extension service, but is not affiliated with it.
>
> The only aspect that is derived from Discohook Utils is webhook creation, which Discord does not handle natively for bots using interactions.

**This was built to integrate with [channel-backup](https://github.com/TinkerStorm/channel-backup), which was built as a command-line tool to update information on a Discord channel.**

> This is by no means a complete solution, but it is a simple one that can be used to create a simple bot that can handle stateless messages. It's handling of the `btn-msg` and `pick-msg` triggers (below) is a bit of a hack, but it works.

## Commands

### `/webhook`

- `/webhook create name: string; channel?: Channel` - Creates a webhook with the given name.
- `/webhook delete id: string` - Deletes the webhook with the given ID.
- `/webhook list` - Lists all webhooks in the current channel.

### `/error`

*Home guild only, used for debugging and runtime safety against ratelimits.*

- `/error get hash: string; origin: string` - Gets the error with the given hash from the given origin.
- `/error all origin: string` - Lists all errors from the given origin.
- `/error clear origin: string` - Clears all errors from the given origin.
- `/error wipe` - Clears all errors from memory.

## Triggers

### Button Message - `btn-msg`

This trigger is used to fetch Discord message responses from files within a GitHub repository.

> Only supports GitHub at the moment, but can be extended to support other services.

#### Format

> `btn-msg:<owner/repo>@<branch>#<path/to/file.yaml>[&<role>...]`

- `owner/repo` - The owner and repository name of the GitHub repository.
- `branch` - The branch of the repository to fetch the file from.
- `path/to/file.yaml` - The path to the file within the repository.
- `&role...` - The roles that are allowed to use this trigger.

*Only `.json`, `.yaml / .yml`, `.md` are supported for now - attempts to use other file types will not match with the assigned pattern.*

### Select Message - `pick-msg`

This trigger is used to pick a response from a list of options.

> Only supports GitHub at the moment, but can be extended to support other services.

---

> Format is almost identical to `btn-msg`, but the target file is moved to the selection options.

#### Format (`~.customID`)

> `pick-msg[&<role>...]`

- `&role...` - The roles that are allowed to use this trigger.

#### Format (`~.options.*.value`)

> `<owner/repo>@<branch>#<path/to/file.yaml>`

- `owner/repo` - The owner and repository name of the GitHub repository.
- `branch` - The branch of the repository to fetch the file from.
- `path/to/file.yaml` - The path to the file within the repository.

#### Format

## Button Role - `btn-role`

This trigger is used to toggle a role on a user when a button is clicked.

### Format

> `btn-role:<role>[&<role>...]`

- `role` - The role to toggle on the user.
- `&role...` - The roles that are allowed to use this trigger.

## `pick-role`

Select one or more roles from a selection of roles (max 25).

> `pick-role[&<role>...]`

- `&role...` - The roles that are allowed to use this trigger.

Roles are handled by the values of the select menu.

- Use of `max_values` decides how many roles can be selected at once.
- Use of `min_values` as `0` allows for complete removal of roles within the specified group.
- Any roles missing from the user's selection will be removed.
