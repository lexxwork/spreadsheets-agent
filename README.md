# datalake-spreadsheets

Google Sheets automation via MCP server. Claude Code reads a table config and scenario, then calls atomic bricks to read/write the spreadsheet.

## How it works

```
Claude Code
    ↓ MCP tools
src/mcp-server.js
    ↓ calls
src/bricks/       ← atomic operations
    ↓
Google Sheets API
```

## Project structure

```
src/
  mcp-server.js   ← MCP server, registers all tools
  config.js       ← loads configs by name
  sheet.js        ← Google Sheets client singleton
  bricks/
    read.js       ← get_sheet_info, read_range, read_all_rows
    write.js      ← write_cells, append_row, clear_range
    find.js       ← find_rows, read_local_data
configs/          ← gitignored, one JSON file per spreadsheet
scenarios/        ← automation scripts and scenario descriptions
.claude/
  agents/         ← Claude Code agents
```

## Config format

Each file in `configs/` describes one spreadsheet:

```json
{
  "spreadsheetId": "...",
  "sheetName": "Sheet1",
  "description": "What this spreadsheet is about",
  "hiddenColumns": ["K", "N"],
  "columns": {
    "A": { "name": "Domain", "type": "key" },
    "B": { "name": "Name",   "type": "text" }
  }
}
```

`hiddenColumns` — columns that return empty values when reading (links, internal data, etc.)

## MCP tools

All tools accept `config` (config file name without `.json`) instead of raw spreadsheet ID.

| Tool | Description |
|------|-------------|
| `list_configs` | List all available configs |
| `get_sheet_info` | Sheet structure: headers, row count |
| `read_range` | Read a cell range (e.g. `A1:D10`) |
| `read_all_rows` | All rows as `{ A: val, B: val, _row: 2 }` |
| `find_rows` | Filter rows by column condition |
| `write_cells` | Batch write `[{ row, col, value }]` |
| `append_row` | Add a row at the end |
| `clear_range` | Clear a cell range |
| `list_revisions` | Show recent local revisions for a config |
| `rollback_revision` | Restore one saved revision by `revisionId` |
| `read_local_data` | Read a local JSON or CSV file |

`find_rows` conditions: `empty`, `not_empty`, `equals`, `contains`, `starts_with`, `not_equals`

## Local revision history

Every write operation stores a local revision in `.sheet-revisions/` before changing the sheet:

- `write_cells` saves previous values for every touched cell
- `append_row` saves the appended row so it can be cleared back out
- `clear_range` saves the cleared rectangle so it can be restored

Write tools now return a `revisionId`. To rollback:

1. Call `list_revisions` for a config
2. Pick the needed `revisionId`
3. Call `rollback_revision`

This is a local audit log for changes made through this MCP server. It does not capture edits made manually in Google Sheets or by other tools.

## Scenarios

### Run a script directly

```bash
node scenarios/mark-loaded.js '{"dbNames":["vk_2021"],"nicknames":["Starman"]}' database-main
```

### Via Claude Code (agent mode)

Just describe the task in natural language — Claude will call the bricks itself:

> "In database-main, find all rows where R is empty and A is not empty, then write the domain without TLD into R"

## Adding a new spreadsheet

1. Create `configs/my-table.json` with spreadsheet ID, sheet name, and column map
2. Share the spreadsheet with the service account: `datalake-sheets-sa@datalake-sheets-2025.iam.gserviceaccount.com`
3. Use `my-table` as the `config` parameter in any tool

## Setup

```bash
npm install
# credentials.json must be present (Google service account key)
```

MCP server is registered in `.mcp.json` and starts automatically with Claude Code.
# spreadsheets-agent
