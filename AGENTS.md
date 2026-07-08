## Module

### General

When creating a feature, use the CQRS pattern: queries whenever possible, commands and events when possible. Use the barrel export pattern.

### Folder structure

- `queries` for queries with subfolders: `handlers`, `impl`, and `tests`
- `commands` for commands with subfolders: `handlers`, `impl`, and `tests`
- `controllers` for controllers
- `interfaces` for types. No types should be defined directly in controllers, queries, commands, or events.
- `helpers` for reusable helpers across the module
- `dto` for DTOs
- `entities` for entities
