// server/lib/sheets/helpers.js
// Generic CRUD layer for Google Sheets - used by all entity-specific modules.
import { getSheetsClient, SPREADSHEET_ID, isConfigured } from '../googleSheets.js';

// ── In-memory cache ───────────────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL_DEFAULT = 30_000; // 30 s for read-heavy data
const CACHE_TTL_AUTH    = 0;      // No caching for auth-critical data

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _cache.delete(key); return null; }
  return entry.data;
}
function setCached(key, data, ttl = CACHE_TTL_DEFAULT) {
  if (ttl <= 0) return;
  _cache.set(key, { data, expiresAt: Date.now() + ttl });
}
export function invalidateCache(sheetName) { _cache.delete(sheetName); }

// ── Type coercions ────────────────────────────────────────────────────────────
function coerceValue(val) {
  if (val === '' || val === undefined || val === null) return '';
  if (val === 'true')  return true;
  if (val === 'false') return false;
  if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
    try { return JSON.parse(val); } catch { return val; }
  }
  const n = Number(val);
  if (!isNaN(n) && val.trim() !== '') return n;
  return val;
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = coerceValue(row[i]); });
  return obj;
}

function objectToRow(headers, obj) {
  return headers.map(h => {
    const v = obj[h];
    if (v === undefined || v === null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  });
}

// ── Concurrency & Rate Limiting ───────────────────────────────────────────────
const sheetLocks = new Map();
async function withLock(sheetName, fn) {
  const prevLock = sheetLocks.get(sheetName) || Promise.resolve();
  let release;
  const newLock = new Promise(resolve => { release = resolve; });
  sheetLocks.set(sheetName, prevLock.then(() => newLock));
  try {
    await prevLock;
    return await fn();
  } finally {
    release();
  }
}

async function withRetry(fn, maxRetries = 3, baseDelayMs = 1000) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries || (err.code !== 429 && err.code !== 500 && err.code !== 502 && err.code !== 503)) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.warn(`[Sheets] API error (${err.code}), retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ── Sheet data helpers ────────────────────────────────────────────────────────

/** Get all rows from a sheet as objects. Returns [] if unconfigured/empty. */
export async function getSheetData(sheetName, cacheTTL = CACHE_TTL_DEFAULT) {
  if (!isConfigured()) return [];
  const cached = getCached(sheetName);
  if (cached) return cached;

  const sheets = getSheetsClient();
  try {
    const res = await withRetry(() => sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    }));
    const rows = res.data.values || [];
    if (rows.length < 2) { setCached(sheetName, [], cacheTTL); return []; }
    const headers = rows[0];
    const data = rows.slice(1).map(r => rowToObject(headers, r));
    setCached(sheetName, data, cacheTTL);
    return data;
  } catch (err) {
    console.error(`[Sheets] getSheetData(${sheetName}) error:`, err.message);
    return [];
  }
}

/** Get headers for a sheet (row 1). */
export async function getSheetHeaders(sheetName) {
  const sheets = getSheetsClient();
  try {
    const res = await withRetry(() => sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:1`,
    }));
    return (res.data.values && res.data.values[0]) ? res.data.values[0] : [];
  } catch { return []; }
}

/** Find a single row by a field value. Returns { row, rowIndex } or { row: null, rowIndex: -1 }. */
export async function findRowByField(sheetName, field, value, cacheTTL = CACHE_TTL_DEFAULT) {
  const rows = await getSheetData(sheetName, cacheTTL);
  const idx  = rows.findIndex(r => String(r[field] || '').toLowerCase() === String(value || '').toLowerCase());
  return { row: idx !== -1 ? rows[idx] : null, rowIndex: idx };
}

/** Append a new row to the sheet. */
export async function appendRow(sheetName, obj) {
  return withLock(sheetName, async () => {
    if (!isConfigured()) return false;
    const sheets  = getSheetsClient();
    const headers = await getSheetHeaders(sheetName);
    if (!headers.length) { console.error(`[Sheets] No headers in ${sheetName}`); return false; }
    try {
      await withRetry(() => sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetName,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [objectToRow(headers, obj)] },
      }));
      invalidateCache(sheetName);
      return true;
    } catch (err) {
      console.error(`[Sheets] appendRow(${sheetName}) error:`, err.message);
      return false;
    }
  });
}

/** Update a row identified by the 0-based data index (row 2 in sheet = dataIndex 0). */
export async function updateRowByDataIndex(sheetName, dataIndex, obj) {
  return withLock(sheetName, async () => {
    if (!isConfigured()) return false;
    const sheets  = getSheetsClient();
    const headers = await getSheetHeaders(sheetName);
    if (!headers.length) return false;
    const sheetRowNumber = dataIndex + 2; // +1 header, +1 1-indexed
    const colEnd = String.fromCharCode(64 + headers.length); // e.g., 30 cols -> 'AD'
    try {
      await withRetry(() => sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A${sheetRowNumber}:${colEnd}${sheetRowNumber}`,
        valueInputOption: 'RAW',
        requestBody: { values: [objectToRow(headers, obj)] },
      }));
      invalidateCache(sheetName);
      return true;
    } catch (err) {
      console.error(`[Sheets] updateRowByDataIndex(${sheetName}, ${dataIndex}) error:`, err.message);
      return false;
    }
  });
}

/** Find a row by its id field and update it. */
export async function updateRowById(sheetName, id, updates, idField = 'id') {
  const { row, rowIndex } = await findRowByField(sheetName, idField, id, 0);
  if (!row) return false;
  const merged = { ...row, ...updates };
  return updateRowByDataIndex(sheetName, rowIndex, merged);
}

/** Delete a row by data index using Google Sheets batchUpdate. */
export async function deleteRowByDataIndex(sheetName, dataIndex, sheetId) {
  return withLock(sheetName, async () => {
    if (!isConfigured()) return false;
    const sheets = getSheetsClient();
    try {
      await withRetry(() => sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: dataIndex + 1, // +1 for header row (0-indexed)
                endIndex:   dataIndex + 2,
              },
            },
          }],
        },
      }));
      invalidateCache(sheetName);
      return true;
    } catch (err) {
      console.error(`[Sheets] deleteRowByDataIndex(${sheetName}) error:`, err.message);
      return false;
    }
  });
}

/** Get the numeric sheet GID (sheetId) by name. */
export async function getSheetId(sheetName) {
  if (!isConfigured()) return null;
  const sheets = getSheetsClient();
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = (meta.data.sheets || []).find(
      s => s.properties.title === sheetName
    );
    return sheet ? sheet.properties.sheetId : null;
  } catch { return null; }
}

/** Initialize a sheet: create it if missing, set headers if empty row 1. */
export async function initSheet(sheetName, headers) {
  if (!isConfigured()) return;
  const sheets = getSheetsClient();
  try {
    // Check if sheet exists
    const meta  = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const found = (meta.data.sheets || []).find(s => s.properties.title === sheetName);
    if (!found) {
      // Create sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
      console.log(`[Sheets] Created sheet: ${sheetName}`);
    }
    // Check if headers row exists
    const existingHeaders = await getSheetHeaders(sheetName);
    if (!existingHeaders.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
      console.log(`[Sheets] Headers set for: ${sheetName}`);
    }
  } catch (err) {
    console.error(`[Sheets] initSheet(${sheetName}) error:`, err.message);
  }
}

/** Unique ID generator */
export function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
