---
name: scenario-authoring
description: Use when the user wants help designing or writing a new spreadsheet scenario script for this repository
---

When invoked:
1. Read `docs/scenarios.md`.
2. Read `README.md` for project structure.
3. Inspect current files in `scenarios/` and `src/bricks/`.

Then help the user create a new scenario by:
- identifying the business task
- choosing the needed bricks
- defining the CLI JSON contract
- deciding which config name the scenario should use
- proposing a minimal implementation shape before editing code

Prefer reusing `read.js`, `write.js`, `find.js`, and `history.js` instead of adding direct Sheets API calls.
