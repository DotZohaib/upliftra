// server/lib/sheets/mentorshipRequests.js
import { getSheetData, findRowByField, appendRow, updateRowById, generateId } from './helpers.js';
const SHEET = 'MentorshipRequests';
export const MREQ_HEADERS = ['id','mentorId','mentorName','mentorAvatar','menteeId',
  'menteeName','menteeEmail','menteeAvatar','topic','goals','preferredTime','preferredDate',
  'notes','status','meetingLink','scheduledDate','scheduledTime','mentorFeedback','rating','createdAt'];
export async function getMentorshipRequests(filters = {}) {
  let rows = await getSheetData(SHEET, 10000);
  if (filters.mentorId) rows = rows.filter(r => r.mentorId === filters.mentorId);
  if (filters.menteeId) rows = rows.filter(r => r.menteeId === filters.menteeId);
  return rows;
}
export async function createMentorshipRequest(req) {
  const n = { ...req, id: generateId('MREQ'), status: 'pending', createdAt: new Date().toISOString() };
  await appendRow(SHEET, n); return n;
}
export async function updateMentorshipRequest(id, updates) { return updateRowById(SHEET, id, updates); }
