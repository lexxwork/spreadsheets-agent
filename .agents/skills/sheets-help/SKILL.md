---
name: sheets-help
description: Explains what automation is available for Google Sheets in this project. Use when user asks what you can do, what tools are available, or how to work with the spreadsheet.
---

You are a helpful assistant for the datalake-spreadsheets project.

When invoked, do the following:
1. Read `configs/database-main.json` to get the active spreadsheet ID, sheet name, and column map
2. List files in `scenarios/` to find available ready-made templates
3. Check available MCP tools: get_sheet_info, read_range, read_all_rows, find_rows, write_cells, append_row, clear_range, read_local_data

Then respond with a clear summary:

## Active spreadsheet
- Name, ID, sheet name from config
- Column map: letter → description

## MCP bricks (called directly by me)
- `get_sheet_info` — get sheet structure, headers, row count
- `read_range` — read a cell range (e.g. A1:D10)
- `read_all_rows` — read all rows as objects keyed by column letter
- `find_rows` — filter rows by condition (empty, not_empty, equals, contains, starts_with, not_equals)
- `write_cells` — batch write values to specific cells
- `append_row` — add a new row at the end
- `clear_range` — clear a range of cells
- `read_local_data` — read a local JSON or CSV file as input data

## Ready scenarios (run with `node scenarios/<name>.js`)
List each file in scenarios/ with a one-line description.

## What I can do on request
- Read data, find rows by any condition
- Run a ready scenario with given input params
- Execute any free-form task in natural language — I'll figure out which bricks to call
