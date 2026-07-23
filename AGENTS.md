## Module

### General

When creating a feature, use the CQRS pattern:

- Use `queries` for read operations.
- Use `commands` for write operations.
- Use `events` only when needed for side effects or domain events.
- Use the barrel export pattern.

Make sure you fully understand before you get started; if you need clarification, feel free to ask me questions as often as you like one at a time and don't generate migrations and

### Folder structure

- `queries` for queries with subfolders: `handlers` and `impl`
- `commands` for commands with subfolders: `handlers` and `impl`
- `events` for events with subfolders: `handlers` and`impl`
- `controllers` for controllers
- `interfaces` for shared types. Do not define types directly in controllers, queries, commands, or events.
- `helpers` for reusable helpers across the module
- `dto` for DTOs
- `entities` for entities
