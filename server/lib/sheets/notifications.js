// server/lib/sheets/notifications.js
import { getSheetData, appendRow, updateRowById, generateId } from './helpers.js';
const SHEET = 'Notifications';
export const NOTIF_HEADERS = ['id','userId','title','description','type','timestamp','read','linkTo'];
export async function getNotifications(userId) {
  const rows = await getSheetData(SHEET, 0);
  return rows.filter(r => r.userId === userId).slice(0, 50);
}
export async function createNotification(notif) {
  const n = { ...notif, id: generateId('NTF'), timestamp: new Date().toISOString(), read: false };
  await appendRow(SHEET, n); return n;
}
export async function markNotificationRead(id) { return updateRowById(SHEET, id, { read: true }); }
export async function markAllRead(userId) {
  const rows = await getSheetData(SHEET, 0);
  const mine = rows.filter(r => r.userId === userId && !r.read);
  for (const n of mine) await updateRowById(SHEET, n.id, { read: true });
}
