# Setup Guide

## Requirements

- Node.js
- npm
- Google `credentials.json` for Sheets API access

## Install

```bash
npm install
```

## Add Credentials

Place the Google credentials file at:

```text
credentials.json
```

This file is intentionally gitignored.

Take `client_email` from this file and add it to the spreadsheet editors in Google Sheets. Without that, scripts and MCP tools will not be able to write to the sheet.

## Verify Authentication

Check auth only:

```bash
node scripts/test-credentials.js
```

Check auth plus spreadsheet access:

```bash
node scripts/test-credentials.js <SPREADSHEET_ID>
```

`SPREADSHEET_ID` is the segment between `/d/` and `/edit` in the Google Sheets URL.

## Create or Add a Config

Configs live in `configs/*.json`. They are mostly gitignored because they usually contain private spreadsheet IDs.

Create a local `configs/write-test.json` or another `configs/<name>.json` using the format in [docs/configs.md](configs.md).

## Quick Smoke Checks

1. `node scripts/test-credentials.js`
2. `node src/mcp-server.js`
3. `node scenarios/write-test.js`

The third command assumes you created a working `configs/write-test.json` with a filled `spreadsheetId` and `sheetName`.

## Common Setup Problems

- `credentials.json not found`
  Create the file in the project root.
- `No access to spreadsheet`
  Open `credentials.json`, copy `client_email`, and add it to the spreadsheet editors in Google Sheets.
- `Config "<name>" not found`
  Add `configs/<name>.json`.
- MCP tools start but reads fail
  Re-check the config's `spreadsheetId` and `sheetName`.
