// server/lib/sheets/sessions.js
import {
  getSheetData, findRowByField, appendRow, updateRowById,
  deleteRowByDataIndex, getSheetId, generateId
} from './helpers.js';

const SHEET = 'Sessions';
export const SESSION_HEADERS = [
  'sessionId','token','userId','userRole','userEmail','userName',
  'createdAt','expiresAt','lastActivityAt','rememberMe','status'
];

export async function createSession(user, token, rememberMe) {
  const now = new Date();
  const ms  = rememberMe ? 7 * 86400000 : 86400000;
  const session = {
    sessionId: generateId('SESS'),
    token,
    userId:    user.id,
    userRole:  user.role,
    userEmail: user.email,
    userName:  user.name,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ms).toISOString(),
    lastActivityAt: now.toISOString(),
    rememberMe,
    status: 'active',
  };
  await appendRow(SHEET, session);
  return session;
}
export async function getSessionByToken(token) {
  const { row } = await findRowByField(SHEET, 'token', token, 0);
  return row;
}
export async function revokeSession(token) {
  return updateRowById(SHEET, token, { status: 'revoked' }, 'token');
}
export async function revokeAllUserSessions(userId) {
  const all  = await getSheetData(SHEET, 0);
  const mine = all.filter(s => s.userId === userId && s.status === 'active');
  for (const s of mine) {
    await updateRowById(SHEET, s.token, { status: 'revoked' }, 'token');
  }
}
