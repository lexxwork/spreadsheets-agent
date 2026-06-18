const fs = require('fs');
const path = require('path');

const CONFIGS_DIR = path.resolve(__dirname, '../configs');

function loadConfig(name) {
  const file = path.join(CONFIGS_DIR, `${name}.json`);
  if (!fs.existsSync(file)) {
    const available = listConfigs().join(', ');
    throw new Error(`Config "${name}" not found. Available: ${available}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function listConfigs() {
  return fs.readdirSync(CONFIGS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

module.exports = { loadConfig, listConfigs };
