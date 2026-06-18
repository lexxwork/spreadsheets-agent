const { writeCells } = require('../src/bricks/write');
const { readAllRows } = require('../src/bricks/read');
const { loadConfig } = require('../src/config');

const CONFIG = 'write-test';
const config = loadConfig(CONFIG);

const now = new Date().toLocaleString('uk-UA');

async function run() {
  // Write headers and a test row.
  await writeCells({
    config: CONFIG,
    spreadsheetId: config.spreadsheetId,
    sheetName: config.sheetName,
    updates: [
      { row: 1, col: 'A', value: 'Timestamp' },
      { row: 1, col: 'B', value: 'Status' },
      { row: 1, col: 'C', value: 'Author' },
      { row: 2, col: 'A', value: now },
      { row: 2, col: 'B', value: 'OK' },
      { row: 2, col: 'C', value: 'DataLake Bot' },
    ],
  });

  console.log('Written. Verifying...');

  const rows = await readAllRows({
    spreadsheetId: config.spreadsheetId,
    sheetName: config.sheetName,
  });

  console.log(`Rows in sheet: ${rows.length}`);
  console.log('Last row:', rows[rows.length - 1]);
}

run().catch(console.error);
