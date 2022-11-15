# Button Message - `btn-msg`

This trigger is used to fetch Discord message responses from files within a GitHub repository.

> Only supports GitHub at the moment, but can be extended to support other services.

## Format

> `btn-msg:<owner/repo>@<branch>#<path/to/file.yaml>[&<role>...]`

- `owner/repo` - The owner and repository name of the GitHub repository.
- `branch` - The branch of the repository to fetch the file from.
- `path/to/file.yaml` - The path to the file within the repository.
- `&role...` - The roles that are allowed to use this trigger.

*Only `.json`, `.yaml / .yml`, `.md` are supported for now - attempts to use other file types will not match with the assigned pattern.*

## Example

```yaml
content: "This is a button message."
components:
  - type: 1
    components:
      - type: 2
        label: "Click me!"
        style: 1
        custom_id: "btn-msg:turbo-eureka@main#examples/button-response.md"
```
