---
name: configs-help
description: Use when the user asks how spreadsheet configs are formed, where they live, how names map to tools, or how to create a safe write-test config
---

When invoked:
1. Read `docs/configs.md`.
2. List local `configs/*.json` files.
3. Explain the config format and current local availability.

You should:
- describe required and optional fields
- explain how config names are derived from filenames
- mention that most real configs are gitignored
- point to `configs/write-test.json` as the recommended demo config name
- explain that `spreadsheetId` and `sheetName` must be present in the config file for MCP tools and scenarios to work

If no configs exist locally, say that clearly instead of assuming one.
