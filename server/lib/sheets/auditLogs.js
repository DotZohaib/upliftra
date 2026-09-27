// server/lib/sheets/auditLogs.js
import { getSheetData, appendRow, generateId } from './helpers.js';
const SHEET = 'AuditLogs';
export const AUDIT_HEADERS = ['id','timestamp','action','userId','userName','userRole','target','details'];
export async function getAuditLogs(limit = 200) {
  const rows = await getSheetData(SHEET, 0);
  return rows.slice(-limit).reverse();
}
export async function logAuditEvent(event) {
  const n = {
    id: generateId('LOG'),
    timestamp: new Date().toISOString(),
    ...event,
  };
  await appendRow(SHEET, n);
  return n;
}
