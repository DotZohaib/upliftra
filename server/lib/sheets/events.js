// server/lib/sheets/events.js
import { getSheetData, findRowByField, appendRow, updateRowById,
  deleteRowByDataIndex, getSheetId, generateId } from './helpers.js';
const SHEET = 'Events';
export const EVENT_HEADERS = ['id','title','description','date','time','speaker','speakerRole',
  'location','isOnline','registrationLink','registeredCount','registeredUserIds',
  'prizePool','status','banner'];
export async function getEvents() { return getSheetData(SHEET, 60000); }
export async function getEventById(id) {
  const { row } = await findRowByField(SHEET, 'id', id, 60000); return row;
}
export async function createEvent(ev) {
  const n = { ...ev, id: generateId('EVT'), registeredCount: 0, registeredUserIds: [] };
  await appendRow(SHEET, n); return n;
}
export async function updateEvent(id, updates) { return updateRowById(SHEET, id, updates); }
export async function registerForEvent(eventId, userId) {
  const ev = await getEventById(eventId);
  if (!ev) return { success: false };
  const ids = Array.isArray(ev.registeredUserIds) ? ev.registeredUserIds : [];
  const already = ids.includes(userId);
  if (already) {
    const newIds = ids.filter(i => i !== userId);
    await updateRowById(SHEET, eventId, { registeredUserIds: newIds, registeredCount: newIds.length });
    return { success: true, registered: false };
  } else {
    const newIds = [...ids, userId];
    await updateRowById(SHEET, eventId, { registeredUserIds: newIds, registeredCount: newIds.length });
    return { success: true, registered: true };
  }
}
