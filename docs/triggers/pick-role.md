# Select Role(s) - `pick-role`

Select one or more roles from a selection of roles (max 25).

## Format (`~.custom_id`)

> `pick-role[&<role>...]`

- `&role...` - (Optional) The roles that are allowed to use this trigger.

## Format (`~.options.*.value`)

> `<role_id>`

- `role_id` - The ID of the role to toggle on the user.

## Example

```yaml
# Path: example/selection.yaml
content: "Select one or more roles from the list below."
components:
  - type: 1
    components:
      - type: 3
        custom_id: pick-role
        placeholder: "Select a role"
        options:
          - label: "Role 1"
            value: "123456789012345678"
          - label: "Role 2"
            value: "123456789012345679"
          - label: "Role 3"
            value: "123456789012345680"
```

## Notes

- Leave the `default` field empty to allow the bot to set values that the user already has roles for.
- Use of `max_values` decides how many roles can be selected at once.
  > If `max_values` is not set, Discord will default to 1.
- Use of `min_values` as `0` allows for complete removal of roles within the specified group.
  > If `min_values` is not set, Discord will default to 1.
- Any roles missing from the user's selection will be removed.
  > Only one request is sent to Discord for roles per trigger.
- Use of an ephemeral role selection can be used to 'remember' roles that were selected.
  > See the [Color Role Example](../examples/color-roles#readme).
