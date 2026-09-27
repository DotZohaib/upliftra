// server/lib/sheets/opportunities.js
import { getSheetData, findRowByField, appendRow, updateRowById,
  deleteRowByDataIndex, getSheetId, generateId } from './helpers.js';
const SHEET = 'Opportunities';
export const OPP_HEADERS = ['id','title','type','company','logo','description','location',
  'remote','workplaceType','salary','deadline','category','officialSource','applicationLink',
  'verificationStatus','partnerType','tags','requirements','experienceLevel','educationRequired',
  'benefits','postedDate','recruiterId','status','featured','aiMatchScore','createdAt'];
export async function getOpportunities(filters = {}) {
  let rows = await getSheetData(SHEET, 20000);
  if (filters.status) rows = rows.filter(r => r.status === filters.status);
  if (filters.type)   rows = rows.filter(r => r.type   === filters.type);
  if (filters.query)  {
    const q = filters.query.toLowerCase();
    rows = rows.filter(r => (r.title + r.company + r.category).toLowerCase().includes(q));
  }
  return rows;
}
export async function getOpportunityById(id) {
  const { row } = await findRowByField(SHEET, 'id', id, 20000);
  return row;
}
export async function createOpportunity(opp) {
  const n = { ...opp, id: opp.id || generateId('OPP'), createdAt: new Date().toISOString() };
  await appendRow(SHEET, n); return n;
}
export async function updateOpportunity(id, updates) {
  return updateRowById(SHEET, id, updates);
}
export async function deleteOpportunity(id) {
  const rows = await getSheetData(SHEET, 0);
  const idx  = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  return deleteRowByDataIndex(SHEET, idx, await getSheetId(SHEET));
}
