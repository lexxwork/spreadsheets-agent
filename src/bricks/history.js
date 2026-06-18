const { getSheets, colToIndex, indexToCol } = require('../sheet');
const { listRevisions, makeRevisionId, readRevision, saveRevision } = require('../revisions');

function parseA1Range(range) {
  const match = /^([A-Z]+)(\d+)?(?::([A-Z]+)?(\d+)?)?$/i.exec(range.trim());
  if (!match) {
    throw new Error(`Unsupported A1 range "${range}"`);
  }

  const [, startColRaw, startRowRaw, endColRaw, endRowRaw] = match;
  return {
    startCol: startColRaw.toUpperCase(),
    startRow: startRowRaw ? Number(startRowRaw) : 1,
    endCol: (endColRaw || startColRaw).toUpperCase(),
    endRow: endRowRaw ? Number(endRowRaw) : null,
    hasExplicitEndCol: Boolean(endColRaw),
    hasExplicitEndRow: Boolean(endRowRaw),
  };
}

function normalizeMatrix(values, height, width) {
  return Array.from({ length: height }, (_, rowIdx) =>
    Array.from({ length: width }, (_, colIdx) => values?.[rowIdx]?.[colIdx] ?? '')
  );
}

function toBoundedRange(range, values) {
  const parsed = parseA1Range(range);
  const startColIndex = colToIndex(parsed.startCol);
  const endColIndex = colToIndex(parsed.endCol);
  const width = parsed.hasExplicitEndCol ? (endColIndex - startColIndex + 1) : Math.max(values[0]?.length || 0, 1);
  const height = parsed.hasExplicitEndRow ? (parsed.endRow - parsed.startRow + 1) : Math.max(values.length || 0, 1);
  const endCol = indexToCol(startColIndex + width - 1);
  const endRow = parsed.startRow + height - 1;

  return {
    boundedRange: `${parsed.startCol}${parsed.startRow}:${endCol}${endRow}`,
    height,
    width,
  };
}

async function snapshotRange({ spreadsheetId, sheetName, range }) {
  const sheets = getSheets();
  const fullRange = `${sheetName}!${range}`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: fullRange });
  const values = res.data.values || [];
  const { boundedRange, height, width } = toBoundedRange(range, values);

  return {
    range: `${sheetName}!${boundedRange}`,
    values: normalizeMatrix(values, height, width),
  };
}

async function listRevisionHistory({ config, limit }) {
  return listRevisions({ config, limit });
}

async function rollbackRevision({ revisionId }) {
  const revision = readRevision(revisionId);
  const sheets = getSheets();
  const data = revision.changes.map(change => ({
    range: change.range,
    values: change.before,
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: revision.spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });

  const rollbackRevisionId = makeRevisionId();
  saveRevision({
    revisionId: rollbackRevisionId,
    basedOnRevisionId: revisionId,
    config: revision.config,
    spreadsheetId: revision.spreadsheetId,
    sheetName: revision.sheetName,
    operation: 'rollback',
    changes: revision.changes.map(change => ({
      range: change.range,
      before: change.after,
      after: change.before,
    })),
  });

  return {
    rolledBackRevisionId: revisionId,
    rollbackRevisionId,
    restoredRanges: revision.changes.length,
  };
}

module.exports = {
  listRevisionHistory,
  rollbackRevision,
  snapshotRange,
};
