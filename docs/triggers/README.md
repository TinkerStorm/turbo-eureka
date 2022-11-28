# Triggers

> **All triggers have a total character limit of 100.**
> - Selection labels, descriptions and values have their own limits of 100 characters each.
> - The client may not show all characters in a selection label or description, but the server will still receive them.

- Button Interactions - `btn-*`
  - [Button Message](./btn-msg.md)
  - [Button Role](./btn-role.md)
- Select Interactions - `pick-*`
  - [Select Message](./pick-msg.md)
  - [Select Role](./pick-role.md)

## Common

> Documentation here is common to all triggers, and also included in the individual trigger documentation for convenience.

### Role Restrictions

> `&role...`

The roles that are allowed to use this trigger.

#### Notes

- If no roles are specified, then anyone can use the given trigger.
- The service does not check for the existence of the roles, so if a role is specified that does not exist, then the trigger will not work for anyone.
- Specifying the literal of `null` on `content`, `embeds` or `components` will allow content of that field to be carried over from the original message.

## General Notes

- If sent after triggering a `*-msg` component, inaccessible components defined by the [restrictions](#role-restrictions) are disabled before sending.
