const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { getSheetInfo, readRange, readAllRows } = require('./bricks/read');
const { writeCells, appendRow, clearRange } = require('./bricks/write');
const { findRows, readLocalData } = require('./bricks/find');
const { listRevisionHistory, rollbackRevision } = require('./bricks/history');
const { loadConfig, listConfigs } = require('./config');

const server = new McpServer({ name: 'spreadsheets-agent', version: '1.0.0' });

server.tool(
  'list_configs',
  'List all available spreadsheet configs by name',
  {},
  async () => {
    const configs = listConfigs();
    return { content: [{ type: 'text', text: JSON.stringify(configs, null, 2) }] };
  }
);

server.tool(
  'get_sheet_info',
  'Get spreadsheet structure: sheet names, column headers, row count',
  {
    config: z.string().describe('Config name (e.g. "database-main")'),
  },
  async ({ config }) => {
    const cfg = loadConfig(config);
    const result = await getSheetInfo({ spreadsheetId: cfg.spreadsheetId, sheetName: cfg.sheetName });
    return { content: [{ type: 'text', text: JSON.stringify({ ...result, hiddenColumns: cfg.hiddenColumns }, null, 2) }] };
  }
);

server.tool(
  'read_range',
  'Read a range of cells, e.g. A1:D10',
  {
    config: z.string().describe('Config name (e.g. "database-main")'),
    range: z.string().describe('Range, e.g. A1:D10 or A:A'),
  },
  async ({ config, range }) => {
    const cfg = loadConfig(config);
    const result = await readRange({ spreadsheetId: cfg.spreadsheetId, sheetName: cfg.sheetName, range });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'read_all_rows',
  'Read all rows as objects keyed by column letter and header name. Applies hiddenColumns from config.',
  {
    config: z.string().describe('Config name (e.g. "database-main")'),
  },
  async ({ config }) => {
    const cfg = loadConfig(config);
    const result = await readAllRows({
      spreadsheetId: cfg.spreadsheetId,
      sheetName: cfg.sheetName,
      hiddenColumns: cfg.hiddenColumns,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'find_rows',
  'Find rows matching a condition in a column. Conditions: empty, not_empty, equals, contains, starts_with, not_equals',
  {
    config: z.string().describe('Config name (e.g. "database-main")'),
    column: z.string().describe('Column letter (A, B, ...) or header name'),
    condition: z.enum(['empty', 'not_empty', 'equals', 'contains', 'starts_with', 'not_equals']),
    value: z.string().optional().describe('Value to compare against (not needed for empty/not_empty)'),
  },
  async ({ config, column, condition, value }) => {
    const cfg = loadConfig(config);
    const result = await findRows({
      spreadsheetId: cfg.spreadsheetId,
      sheetName: cfg.sheetName,
      hiddenColumns: cfg.hiddenColumns,
      column,
      condition,
      value,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'write_cells',
  'Write values to specific cells. updates: [{row, col, value}]',
  {
    config: z.string().describe('Config name (e.g. "database-main")'),
    updates: z.array(z.object({
      row: z.number().describe('Row number (starting from 2, row 1 is the header)'),
      col: z.string().describe('Column letter (A, B, ...)'),
      value: z.string().describe('Value to write'),
    })),
  },
  async ({ config, updates }) => {
    const cfg = loadConfig(config);
    const result = await writeCells({ config, spreadsheetId: cfg.spreadsheetId, sheetName: cfg.sheetName, updates });
    result.config = config;
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'append_row',
  'Append a new row to the end of the sheet',
  {
    config: z.string().describe('Config name (e.g. "database-main")'),
    values: z.array(z.string()).describe('Array of values for the new row'),
  },
  async ({ config, values }) => {
    const cfg = loadConfig(config);
    const result = await appendRow({ config, spreadsheetId: cfg.spreadsheetId, sheetName: cfg.sheetName, values });
    result.config = config;
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'clear_range',
  'Clear a range of cells',
  {
    config: z.string().describe('Config name (e.g. "database-main")'),
    range: z.string().describe('Range, e.g. B2:B100'),
  },
  async ({ config, range }) => {
    const cfg = loadConfig(config);
    const result = await clearRange({ config, spreadsheetId: cfg.spreadsheetId, sheetName: cfg.sheetName, range });
    result.config = config;
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'list_revisions',
  'List recent local revisions for a spreadsheet config',
  {
    config: z.string().describe('Config name (e.g. "database-main")'),
    limit: z.number().int().min(1).max(100).optional().describe('How many latest revisions to return'),
  },
  async ({ config, limit }) => {
    loadConfig(config);
    const result = await listRevisionHistory({ config, limit: limit || 20 });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'rollback_revision',
  'Rollback one previously saved local revision by revisionId',
  {
    revisionId: z.string().describe('Revision id returned by write tools or list_revisions'),
  },
  async ({ revisionId }) => {
    const result = await rollbackRevision({ revisionId });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'read_local_data',
  'Read a local JSON or CSV file as a data source',
  {
    filePath: z.string().describe('File path relative to working directory'),
  },
  async ({ filePath }) => {
    const result = await readLocalData({ filePath });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
