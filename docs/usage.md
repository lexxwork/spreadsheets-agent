# Usage Guide

## Through CLI

Run a local scenario directly:

```bash
node scenarios/write-test.js
node scenarios/mark-loaded.js '{"dbNames":["example-db"]}' database-main
```

Use CLI when:

- you already know which scenario to run
- the task is stable and repeatable
- you want to script around it

## Through An Agent Over MCP

Start the MCP server:

```bash
node src/mcp-server.js
```

If your client supports project-local MCP config, it can also read `.mcp.json`.

Then describe the task in natural language, for example:

- "List available spreadsheet configs."
- "Show headers and row count for config `write-test`."
- "Find rows in config `database-main` where column `O` equals `pending`."
- "Write `OK` to cells `B2` and `B3` in config `write-test`."

## How To Learn The Project Quickly

1. Read [README.md](../README.md)
2. Run [setup checks](setup.md)
3. Inspect current scenarios in [docs/scenarios.md](scenarios.md)
4. Create a safe local config from [docs/configs.md](configs.md)
5. Run `node scenarios/write-test.js`

## When To Use Which Mode

- Use CLI when you want one known script.
- Use MCP tools when you want interactive inspection or custom one-off operations.
- Write a new scenario when the task repeats or has business-specific logic.
