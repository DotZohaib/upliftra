// server/lib/sheets/connections.js
import { getSheetData, appendRow, updateRowById, generateId } from './helpers.js';
const SHEET = 'Connections';
export const CONN_HEADERS = ['id','requesterId','requesterName','requesterRole','requesterAvatar',
  'requesterTitle','receiverId','receiverName','status','createdAt'];
export async function getConnections(userId) {
  const rows = await getSheetData(SHEET, 30000);
  return rows.filter(r => r.requesterId === userId || r.receiverId === userId);
}
export async function createConnection(conn) {
  const n = { ...conn, id: generateId('CON'), status: 'pending', createdAt: new Date().toISOString() };
  await appendRow(SHEET, n); return n;
}
export async function updateConnection(id, updates) { return updateRowById(SHEET, id, updates); }
