const { readAllRows } = require('./read');

async function findRows({ spreadsheetId, sheetName, column, condition, value }) {
  const rows = await readAllRows({ spreadsheetId, sheetName });

  return rows.filter(row => {
    const cell = row[column] ?? '';
    switch (condition) {
      case 'empty':    return cell === '' || cell === null || cell === undefined;
      case 'not_empty': return cell !== '' && cell !== null && cell !== undefined;
      case 'equals':   return cell === value;
      case 'contains': return String(cell).includes(value);
      case 'starts_with': return String(cell).startsWith(value);
      case 'not_equals': return cell !== value;
      default:         return true;
    }
  });
}

async function readLocalData({ filePath }) {
  const fs = require('fs');
  const path = require('path');
  const abs = path.resolve(filePath);

  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);

  const ext = path.extname(abs).toLowerCase();
  const content = fs.readFileSync(abs, 'utf-8');

  if (ext === '.json') return JSON.parse(content);
  if (ext === '.csv') {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const vals = line.split(',');
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim()]));
    });
  }
  return content;
}

module.exports = { findRows, readLocalData };
