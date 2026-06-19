---
name: write-test-help
description: Use when the user wants the safest possible end-to-end demo of writing to a sheet, or asks how the write-test config and scenario work
---

When invoked:
1. Read `docs/setup.md`.
2. Read `docs/configs.md`.
3. Read `docs/scenarios.md`.
4. Read `scenarios/write-test.js`.

Explain:
- that `write-test` is the demo scenario kept in git
- that the user should create `configs/write-test.json`
- that `node scenarios/write-test.js` writes to the configured safe sheet and reads the result back
- that `configs/write-test.json` must contain a real `spreadsheetId` and `sheetName`

Warn the user that this scenario performs a real write and should point only to a disposable test sheet.
