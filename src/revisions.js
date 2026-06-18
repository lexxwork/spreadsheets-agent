const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REVISIONS_DIR = path.resolve(__dirname, '../.sheet-revisions');

function ensureRevisionsDir() {
  fs.mkdirSync(REVISIONS_DIR, { recursive: true });
}

function makeRevisionId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = crypto.randomBytes(4).toString('hex');
  return `${stamp}-${suffix}`;
}

function revisionPath(revisionId) {
  return path.join(REVISIONS_DIR, `${revisionId}.json`);
}

function saveRevision(revision) {
  ensureRevisionsDir();
  const stored = {
    createdAt: new Date().toISOString(),
    ...revision,
  };
  fs.writeFileSync(revisionPath(stored.revisionId), JSON.stringify(stored, null, 2));
  return stored;
}

function readRevision(revisionId) {
  const file = revisionPath(revisionId);
  if (!fs.existsSync(file)) {
    throw new Error(`Revision "${revisionId}" not found`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function listRevisions({ config, limit = 20 }) {
  ensureRevisionsDir();
  const items = fs.readdirSync(REVISIONS_DIR)
    .filter(name => name.endsWith('.json'))
    .map(name => JSON.parse(fs.readFileSync(path.join(REVISIONS_DIR, name), 'utf-8')))
    .filter(item => !config || item.config === config)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  return items.map(item => ({
    revisionId: item.revisionId,
    createdAt: item.createdAt,
    config: item.config,
    sheetName: item.sheetName,
    operation: item.operation,
    changeCount: item.changes?.length || 0,
    basedOnRevisionId: item.basedOnRevisionId || null,
  }));
}

module.exports = {
  makeRevisionId,
  saveRevision,
  readRevision,
  listRevisions,
};
