# Config Guide

## Where Configs Live

Configs are loaded from:

```text
configs/<name>.json
```

The MCP server and scenarios refer to the config by `<name>` without `.json`.

## Minimal Format

```json
{
  "spreadsheetId": "YOUR_SPREADSHEET_ID",
  "sheetName": "Sheet1"
}
```

## Supported Fields

- `spreadsheetId` — required
- `sheetName` — required
- `description` — optional human-readable note
- `hiddenColumns` — optional array of column letters hidden only by `read_all_rows`
- `columns` — optional map for your own documentation and agent guidance

## Recommended `write-test` Config

For the demo scenario, create:

```text
configs/write-test.json
```

Suggested content:

```json
{
  "spreadsheetId": "YOUR_SPREADSHEET_ID",
  "sheetName": "Sheet1",
  "description": "Safe sheet for write-test scenario",
  "columns": {
    "A": { "name": "Timestamp", "type": "text" },
    "B": { "name": "Status", "type": "text" },
    "C": { "name": "Author", "type": "text" }
  }
}
```

## Recommended Workflow

1. Create `configs/write-test.json`.
2. Set the real `spreadsheetId`.
3. Replace `Sheet1` if needed.
4. Run:

```bash
node scripts/test-credentials.js YOUR_SPREADSHEET_ID
```

## How Config Discovery Works

`src/config.js` loads all `configs/*.json` files and exposes them by filename:

- `configs/write-test.json` becomes config name `write-test`
- `configs/customer-a.json` becomes config name `customer-a`

If a config is missing, the loader returns an error that includes available config names.

## Notes About Git

- Real configs are gitignored by default.
- `write-test` is the recommended local config name for the demo scenario.
- If you decide to track a safe demo config intentionally, add a narrow exception in `.gitignore`.
