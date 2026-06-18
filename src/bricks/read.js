const { getSheets, indexToCol } = require('../sheet');

async function getSheetInfo({ spreadsheetId, sheetName }) {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetNames = meta.data.sheets.map(s => s.properties.title);

  const target = sheetName || sheetNames[0];
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${target}!1:1`,
  });

  const headers = res.data.values?.[0] || [];
  const countRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: target,
  });
  const rowCount = (countRes.data.values?.length || 1) - 1;

  return {
    sheets: sheetNames,
    activeSheet: target,
    headers: headers.map((h, i) => ({ col: indexToCol(i), name: h })),
    rowCount,
  };
}

async function readRange({ spreadsheetId, sheetName, range }) {
  const sheets = getSheets();
  const fullRange = sheetName ? `${sheetName}!${range}` : range;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: fullRange });
  return res.data.values || [];
}

async function readAllRows({ spreadsheetId, sheetName, hiddenColumns }) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  return rows.slice(1).map((row, i) => {
    const obj = { _row: i + 2 };
    headers.forEach((h, j) => {
      const col = indexToCol(j);
      const value = hiddenColumns && hiddenColumns.includes(col) ? '' : (row[j] ?? '');
      obj[col] = value;
      obj[h] = value;
    });
    return obj;
  });
}

module.exports = { getSheetInfo, readRange, readAllRows };
