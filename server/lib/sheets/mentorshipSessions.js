// server/lib/sheets/mentorshipSessions.js
import { getSheetData, findRowByField, appendRow, updateRowById, generateId } from './helpers.js';
const SHEET = 'MentorshipSessions';
export const MSESS_HEADERS = ['id','mentorId','mentorName','mentorAvatar','menteeId',
  'menteeName','topic','scheduledTime','meetingLink','status','rating','feedback','review'];
export async function getMentorshipSessions(filters = {}) {
  let rows = await getSheetData(SHEET, 10000);
  if (filters.mentorId) rows = rows.filter(r => r.mentorId === filters.mentorId);
  if (filters.menteeId) rows = rows.filter(r => r.menteeId === filters.menteeId);
  return rows;
}
export async function createMentorshipSession(sess) {
  const n = { ...sess, id: generateId('SESS'), status: sess.status || 'confirmed' };
  await appendRow(SHEET, n); return n;
}
export async function updateMentorshipSession(id, updates) { return updateRowById(SHEET, id, updates); }
