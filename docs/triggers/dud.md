# Any Component `dud`

This trigger is used to do nothing when a button is clicked.

## Format

> `dud[:**][?debug]`

- `:**` - (Optional) The Unique ID of the component.
- `?debug` - (Optional) The debug flag.

## Example

```yaml
# Path: example/query.yaml
content: "Click the button to do nothing."
components:
  - type: 1
    components:
      # do nothing
      - type: 2
        custom_id: "dud"
        label: "Do Nothing"
        style: 1
      # do nothing with debug
      - type: 2
        custom_id: "dud?debug"
        label: "Do Nothing (Debug)"
        style: 1
      # do nothing with unique id
      - type: 2
        custom_id: "dud:123456789012345678"
        label: "Do Nothing (Unique ID)"
        style: 1
      # do nothing with unique id and debug
      - type: 2
        custom_id: "dud:123456789012345678?debug"
        label: "Do Nothing (Unique ID & Debug)"
        style: 1
```

## Notes

- This trigger is used to do nothing when a button is clicked, by default.
- Adding `?debug` to the end of the `custom_id` will enable debug mode.
- *It is required to add a unique id to the `custom_id` if you want to use multiple `dud` triggers in the same message. Add any string of numbers and letters after the `:` to make the `custom_id` unique.*
- *Useful in demos / mock-ups for users (with or without debug mode).*
