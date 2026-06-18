const { getSheets } = require('../sheet');
const { makeRevisionId, saveRevision } = require('../revisions');
const { snapshotRange } = require('./history');

// updates: [{ row: 2, col: 'B', value: 'text' }, ...]
async function writeCells({ config, spreadsheetId, sheetName, updates }) {
  const sheets = getSheets();
  const sheet = sheetName;
  const revisionId = makeRevisionId();

  const ranges = updates.map(({ row, col }) => `${sheetName}!${col}${row}`);
  const batchRes = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });
  const changes = updates.map(({ row, col, value }, i) => {
    const vals = batchRes.data.valueRanges[i]?.values || [];
    return { range: `${sheetName}!${col}${row}`, before: [[vals[0]?.[0] ?? '']], after: [[value]] };
  });

  const data = updates.map(({ row, col, value }) => ({
    range: `${sheet}!${col}${row}`,
    values: [[value]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'USER_ENTERED', data },
  });

  saveRevision({
    revisionId,
    config,
    spreadsheetId,
    sheetName,
    operation: 'write_cells',
    changes,
  });

  return { updated: updates.length, revisionId };
}

async function appendRow({ config, spreadsheetId, sheetName, values }) {
  const sheets = getSheets();
  const sheet = sheetName;
  const revisionId = makeRevisionId();

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheet,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });

  const updatedRange = res.data.updates?.updatedRange;
  if (!updatedRange) {
    throw new Error('Append succeeded but API did not return updatedRange');
  }

  saveRevision({
    revisionId,
    config,
    spreadsheetId,
    sheetName,
    operation: 'append_row',
    changes: [{
      range: updatedRange,
      before: [Array.from({ length: values.length }, () => '')],
      after: [values],
    }],
  });

  return { appended: true, revisionId, updatedRange };
}

async function clearRange({ config, spreadsheetId, sheetName, range }) {
  const sheets = getSheets();
  const revisionId = makeRevisionId();
  const snapshot = await snapshotRange({ spreadsheetId, sheetName, range });
  const fullRange = sheetName ? `${sheetName}!${range}` : range;
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: fullRange });

  saveRevision({
    revisionId,
    config,
    spreadsheetId,
    sheetName,
    operation: 'clear_range',
    changes: [{
      range: snapshot.range,
      before: snapshot.values,
      after: snapshot.values.map(row => row.map(() => '')),
    }],
  });

  return { cleared: fullRange, revisionId };
}

module.exports = { writeCells, appendRow, clearRange };
