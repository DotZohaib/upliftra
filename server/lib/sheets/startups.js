// server/lib/sheets/startups.js
import { getSheetData, findRowByField, appendRow, updateRowById,
  deleteRowByDataIndex, getSheetId, generateId } from './helpers.js';
const SHEET = 'Startups';
export const STARTUP_HEADERS = ['id','name','tagline','description','industry','city','stage',
  'founderName','founderId','founders','lookingFor','openRoles','seekingCoFounder',
  'logo','website','fundingStatus','teamSize','createdAt'];
export async function getStartups() { return getSheetData(SHEET, 60000); }
export async function getStartupById(id) {
  const { row } = await findRowByField(SHEET, 'id', id, 60000); return row;
}
export async function createStartup(startup) {
  const n = { ...startup, id: generateId('STR'), createdAt: new Date().toISOString() };
  await appendRow(SHEET, n); return n;
}
export async function updateStartup(id, updates) { return updateRowById(SHEET, id, updates); }
export async function deleteStartup(id) {
  const rows = await getSheetData(SHEET, 0);
  const idx  = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  return deleteRowByDataIndex(SHEET, idx, await getSheetId(SHEET));
}
