// server/lib/sheets/mentors.js
import { getSheetData, findRowByField, appendRow, updateRowById,
  deleteRowByDataIndex, getSheetId, generateId } from './helpers.js';
const SHEET = 'Mentors';
export const MENTOR_HEADERS = ['id','userId','name','avatar','roleTitle','company',
  'almaMater','expertise','experience','availability','rating','totalSessions',
  'bio','isProBono','hourlyRate','status'];
export async function getMentors() { return getSheetData(SHEET, 60000); }
export async function getMentorById(id) {
  const { row } = await findRowByField(SHEET, 'id', id, 60000); return row;
}
export async function createMentor(mentor) {
  const n = { ...mentor, id: generateId('MNT') };
  await appendRow(SHEET, n); return n;
}
export async function updateMentor(id, updates) { return updateRowById(SHEET, id, updates); }
export async function deleteMentor(id) {
  const rows = await getSheetData(SHEET, 0);
  const idx  = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  return deleteRowByDataIndex(SHEET, idx, await getSheetId(SHEET));
}
