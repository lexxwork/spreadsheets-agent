const { readAllRows } = require('../src/bricks/read');
const { writeCells } = require('../src/bricks/write');
const { loadConfig } = require('../src/config');

const configName = process.argv[3] || 'database-main';
const config = loadConfig(configName);

const { dbNames, nicknames } = JSON.parse(process.argv[2]);
// nicknames is optional — if omitted, match by dbName only

const today = new Date().toLocaleDateString('uk-UA', {
  day: '2-digit', month: '2-digit', year: 'numeric'
});

async function run() {
  const rows = await readAllRows({
    spreadsheetId: config.spreadsheetId,
    sheetName: config.sheetName,
  });

  const updates = [];

  for (const row of rows) {
    const dbMatch = dbNames.includes((row['R'] || '').trim());
    const nickMatch = !nicknames || nicknames.includes(row['P']);

    if (dbMatch && nickMatch) {
      updates.push({ row: row._row, col: 'T', value: ' +' });
      updates.push({ row: row._row, col: 'U', value: ' +' });
      updates.push({ row: row._row, col: 'V', value: today });
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

  console.log(`Updated ${updates.length / 3} rows`);
}

run().catch(console.error);
