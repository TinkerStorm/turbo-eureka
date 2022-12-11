# Select Message - `pick-msg`

This trigger is used to pick a response from a list of options.

> Only supports GitHub at the moment, but can be extended to support other services.

## Format (`~.custom_id`)

> `pick-msg[&<role>...]`

- `&role...` - (Optional) The roles that are allowed to use this trigger.

## Format (`~.options.*.value`)

> `<owner/repo>@<branch>#<path/to/file.yaml>`

- `owner/repo` - The owner and repository name of the GitHub repository.
- `branch` - The branch of the repository to fetch the file from.
- `path/to/file.yaml` - The path to the file within the repository.

## Example

```yaml
# Path: example/query.yaml
content: "Pick a response from the list below."
components:
  - type: 3
    custom_id: "pick-msg"
    # ~.custom_id
    options:
      - label: "Response 1"
        value: "TinkerStorm/channel-backup@main#example/response1.md"
        # ~.options.0.value
      - label: "Response 2"
        value: "TinkerStorm/channel-backup@main#example/response2.md"
        # ~.options.1.value
      - label: "Response 3"
        value: "TinkerStorm/channel-backup@main#example/response3.md"
        # ~.options.2.value
```
