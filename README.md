# spreadsheets-agent

Google Sheets automation via an MCP server. The project exposes small, composable tools for reading and updating spreadsheets through the Google Sheets API.

## How it works

```text
Codex / Claude Code
    ↓ MCP tools
src/mcp-server.js
    ↓ calls
src/bricks/
    ↓
Google Sheets API
```

## Project structure

```text
src/
  mcp-server.js   ← MCP server, registers all tools
  config.js       ← loads configs by name
  sheet.js        ← Google Sheets client singleton
  revisions.js    ← local revision storage in .sheet-revisions/
  bricks/
    read.js       ← get_sheet_info, read_range, read_all_rows
    write.js      ← write_cells, append_row, clear_range
    find.js       ← find_rows, read_local_data
    history.js    ← list_revisions, rollback_revision
configs/          ← gitignored, one JSON file per spreadsheet
scenarios/        ← example automation scripts
.mcp.json         ← MCP config used by Claude Code
```

## Config format

Each file in `configs/` describes one spreadsheet:

```json
{
  "spreadsheetId": "...",
  "sheetName": "Sheet1",
  "description": "What this spreadsheet is about",
  "hiddenColumns": ["K", "N"]
}
```

Used fields:

- `spreadsheetId` is required.
- `sheetName` is required.
- `hiddenColumns` is optional.
- `description` is optional.

`hiddenColumns` are masked only in `read_all_rows`. `read_range` returns raw sheet values, and `find_rows` currently reads raw row data as well.

## MCP tools

All spreadsheet tools accept `config` as the config file name without `.json`.

| Tool | Description |
|------|-------------|
| `list_configs` | List all available configs |
| `get_sheet_info` | Sheet names, headers, active sheet, row count |
| `read_range` | Read a cell range such as `A1:D10` |
| `read_all_rows` | Read all rows as objects keyed by column letter and header name |
| `find_rows` | Filter rows by column condition |
| `write_cells` | Batch write `[{ row, col, value }]` |
| `append_row` | Append a row to the end of the sheet |
| `clear_range` | Clear a cell range |
| `list_revisions` | Show recent local revisions for a config |
| `rollback_revision` | Restore a saved revision by `revisionId` |
| `read_local_data` | Read a local JSON or CSV file |

`find_rows` supports these conditions: `empty`, `not_empty`, `equals`, `contains`, `starts_with`, `not_equals`.

## Local revision history

Every write operation saves a local revision in `.sheet-revisions/` before changing the sheet:

- `write_cells` stores the previous value of each touched cell
- `append_row` stores the appended row range
- `clear_range` stores the cleared rectangle

Write tools return a `revisionId`. To rollback:

1. Call `list_revisions` for a config.
2. Choose the needed `revisionId`.
3. Call `rollback_revision`.

This revision log is local to this MCP server. It does not include manual edits made directly in Google Sheets or changes made by other tools.

## Scenarios

### Run a script directly

```bash
node scenarios/<script>.js '<json-args>' <config-name>
```

### Via an MCP client

Describe the task in natural language and let the client call the tools. Example:

> Read rows from a configured spreadsheet, filter them by a condition, and write the result back to a target column.

## Adding a new spreadsheet

1. Create `configs/my-table.json` with at least `spreadsheetId` and `sheetName`.
2. Share the spreadsheet with the service account from your `credentials.json`.
3. Use `my-table` as the `config` parameter in MCP tools.

## Setup

```bash
npm install
# credentials.json must be present (Google service account key)
node test-credentials.js
```

The server expects `credentials.json` in the project root.

## MCP setup

This repository already includes `.mcp.json` for MCP-aware clients that read project-local server configuration:

```json
{
  "mcpServers": {
    "spreadsheets-agent": {
      "type": "stdio",
      "command": "node",
      "args": ["src/mcp-server.js"]
    }
  }
}
```
