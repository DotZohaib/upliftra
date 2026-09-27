// server/lib/sheets/communityReports.js
import { getSheetData, appendRow, updateRowById, generateId } from './helpers.js';
const SHEET = 'CommunityReports';
export const CREPORT_HEADERS = ['id','postId','postContentSnippet','postAuthor',
  'reportedBy','reporterName','reason','createdAt','status'];
export async function getCommunityReports() { return getSheetData(SHEET, 10000); }
export async function createCommunityReport(report) {
  const n = { ...report, id: generateId('RPT'), status: 'pending', createdAt: new Date().toISOString() };
  await appendRow(SHEET, n); return n;
}
export async function updateCommunityReport(id, updates) { return updateRowById(SHEET, id, updates); }
