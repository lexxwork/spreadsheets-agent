const { sheets } = require('@googleapis/sheets');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');

let _sheets = null;

function getSheets() {
  if (_sheets) return _sheets;
  const auth = new GoogleAuth({
    keyFile: path.resolve(__dirname, '../credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  _sheets = sheets({ version: 'v4', auth });
  return _sheets;
}

function colToIndex(col) {
  col = col.toUpperCase();
  let n = 0;
  for (const c of col) n = n * 26 + c.charCodeAt(0) - 64;
  return n - 1;
}

function indexToCol(n) {
  let col = '';
  n += 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    col = String.fromCharCode(65 + r) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

module.exports = { getSheets, colToIndex, indexToCol };
