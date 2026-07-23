## Module

When creating a feature, use the CQRS pattern: queries whenever possible, commands and events when possible. Use the barrel export pattern.

Make sure you fully understand before you get started; if you need clarification, feel free to ask me questions as often as you like one at a time and don't generate migrations and

### Folder structure

- `queries` for queries with subfolders: `handlers`, `impl`, and `tests`
- `commands` for commands with subfolders: `handlers`, `impl`, and `tests`
- `controllers` for controllers
- `interfaces` for types. No types should be defined directly in controllers, queries, commands, or events.
- `helpers` for reusable helpers across the module
- `dto` for DTOs
- `entities` for entities
