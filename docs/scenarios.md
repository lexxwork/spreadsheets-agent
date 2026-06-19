# Scenario Guide

## What A Scenario Is

A scenario is a plain Node.js script in `scenarios/` that composes the lower-level bricks from `src/bricks/`.

Use a scenario when you want a repeatable task such as:

- mark rows that match a business rule
- enrich a sheet from local CSV or JSON
- run a safe write test

## Existing Scenarios

- `scenarios/write-test.js`
  Writes headers and one test row to a safe test sheet, then reads the rows back.
- `scenarios/mark-loaded.js`
  Finds rows by `DbName` and optional nickname, then marks columns `T`, `U`, and `V`.

## Run A Scenario From CLI

General form:

```bash
node scenarios/<script>.js '<json-args>' <config-name>
```

Examples:

```bash
node scenarios/mark-loaded.js '{"dbNames":["example-db"]}' database-main
node scenarios/mark-loaded.js '{"dbNames":["example-db"],"nicknames":["alex"]}' database-main
```

`scenarios/write-test.js` is a special case. It hardcodes config name `write-test`, so it runs as:

```bash
node scenarios/write-test.js
```

## Authoring Pattern

Typical scenario structure:

1. Read CLI args and select config
2. Load config with `loadConfig`
3. Read rows or ranges with `src/bricks/read`
4. Build an `updates` array
5. Write with `writeCells`, `appendRow`, or `clearRange`
6. Log what happened

## Minimal Template

```js
const { readAllRows } = require('../src/bricks/read');
const { writeCells } = require('../src/bricks/write');
const { loadConfig } = require('../src/config');

const configName = process.argv[3] || 'write-test';
const config = loadConfig(configName);
const args = JSON.parse(process.argv[2] || '{}');

async function run() {
  const rows = await readAllRows({
    spreadsheetId: config.spreadsheetId,
    sheetName: config.sheetName,
    hiddenColumns: config.hiddenColumns,
  });

  const updates = [];

  for (const row of rows) {
    if (args.matchValue && row.A === args.matchValue) {
      updates.push({ row: row._row, col: 'B', value: 'matched' });
    }
  }

  if (updates.length === 0) {
    console.log('No matching rows found');
    return;
  }

  await writeCells({
    config: configName,
    spreadsheetId: config.spreadsheetId,
    sheetName: config.sheetName,
    updates,
  });

  console.log(`Updated ${updates.length} cells`);
}

run().catch(console.error);
```

## Authoring Rules

- Keep the scenario focused on one business task.
- Prefer existing bricks over direct Sheets API calls.
- Accept JSON input through CLI when the task needs parameters.
- Use a safe test sheet first.
- If the scenario writes, verify rollback behavior through `list_revisions` and `rollback_revision`.
