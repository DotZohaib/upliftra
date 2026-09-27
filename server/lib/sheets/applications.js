// server/lib/sheets/applications.js
import { getSheetData, findRowByField, appendRow, updateRowById,
  deleteRowByDataIndex, getSheetId, generateId } from './helpers.js';
const SHEET = 'Applications';
export const APP_HEADERS = ['id','opportunityId','opportunityTitle','company',
  'applicantId','applicantName','applicantEmail','applicantPhone','applicantAvatar',
  'status','appliedDate','cvName','cvUrl','coverLetter','interviewDate',
  'meetingLink','notes','recruiterNotes','reviewedDate'];
export async function getApplications(filters = {}) {
  let rows = await getSheetData(SHEET, 10000);
  if (filters.applicantId)   rows = rows.filter(r => r.applicantId   === filters.applicantId);
  if (filters.opportunityId) rows = rows.filter(r => r.opportunityId === filters.opportunityId);
  return rows;
}
export async function getApplicationById(id) {
  const { row } = await findRowByField(SHEET, 'id', id, 0);
  return row;
}
export async function createApplication(app) {
  const n = {
    ...app, id: generateId('APP'),
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'Submitted',
  };
  await appendRow(SHEET, n); return n;
}
export async function updateApplication(id, updates) {
  return updateRowById(SHEET, id, { ...updates, reviewedDate: new Date().toISOString().split('T')[0] });
}
export async function deleteApplication(id) {
  const rows = await getSheetData(SHEET, 0);
  const idx  = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  return deleteRowByDataIndex(SHEET, idx, await getSheetId(SHEET));
}
