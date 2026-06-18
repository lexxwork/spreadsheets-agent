#!/usr/bin/env node
// Verifies that credentials.json works and the spreadsheet is accessible.
// Usage: node test-credentials.js [SPREADSHEET_ID]

const { sheets: sheetsClient } = require('@googleapis/sheets');
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const CREDS_FILE = path.join(__dirname, 'credentials.json');
const SPREADSHEET_ID = process.argv[2];

async function main() {
  if (!fs.existsSync(CREDS_FILE)) {
    console.error('❌ credentials.json not found');
    process.exit(1);
  }

  const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
  console.log(`✅ credentials.json loaded`);
  console.log(`   Service account: ${creds.client_email}`);

  const auth = new GoogleAuth({
    keyFile: CREDS_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = sheetsClient({ version: 'v4', auth });

  if (!SPREADSHEET_ID) {
    console.log('\n⚠  No spreadsheet ID provided — checking auth only...');
    await auth.getClient();
    console.log('✅ Google API authorization successful!');
    console.log('\nTo verify spreadsheet access:');
    console.log('  node test-credentials.js <SPREADSHEET_ID>');
    console.log('\nSPREADSHEET_ID is the part of the spreadsheet URL:');
    console.log('  https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit');
    return;
  }

  console.log(`\n📋 Checking access to spreadsheet: ${SPREADSHEET_ID}`);
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    console.log(`✅ Spreadsheet accessible: "${res.data.properties.title}"`);
    console.log(`   Sheets: ${res.data.sheets.length}`);
    res.data.sheets.forEach(s => console.log(`   - ${s.properties.title}`));
  } catch (err) {
    if (err.status === 403 || err.status === 404) {
      console.error(`❌ No access to spreadsheet.`);
      console.error(`   Grant access to the service account: ${creds.client_email}`);
      console.error(`   File → Share → Add member`);
    } else {
      console.error(`❌ Error: ${err.message}`);
    }
    process.exit(1);
  }
}

main();
