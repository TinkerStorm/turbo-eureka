# Button Role - `btn-role`

This trigger is used to toggle a role on a user when a button is clicked.

## Format

> `btn-role:<role>[&<role>...]`

- `role` - The role to toggle on the user.
- `&role...` - The roles that are allowed to use this trigger.

## Example

```yaml
# Path: example/query.yaml
content: "Click the button to toggle the role."
components:
  - type: 1
    components:
      # toggle 123456789012345678
      - type: 2
        custom_id: "btn-role:123456789012345678"
        label: "Toggle Role 1"
        style: 1
      # toggle 123456789012345678 requiring 234567890123456789
      - type: 2
        custom_id: "btn-role:123456789012345678&234567890123456789"
        label: "Toggle Role 2"
        style: 1
