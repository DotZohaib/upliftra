// server/lib/sheets/certificates.js
import { getSheetData, findRowByField, appendRow, updateRowById, generateId } from './helpers.js';
const SHEET = 'Certificates';
export const CERT_HEADERS = ['id','certificateId','userId','userName','courseId','courseName',
  'trainerName','issueDate','verificationStatus','verificationHash','hecAligned'];
export async function getCertificates(userId) {
  const rows = await getSheetData(SHEET, 30000);
  return userId ? rows.filter(r => r.userId === userId) : rows;
}
export async function getCertificateById(certId) {
  const { row } = await findRowByField(SHEET, 'certificateId', certId, 30000); return row;
}
export async function createCertificate(cert) {
  const n = {
    ...cert,
    id: generateId('CERT'),
    certificateId: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
    issueDate: new Date().toISOString().split('T')[0],
    verificationHash: `0x${Math.random().toString(16).slice(2,10)}${Math.random().toString(16).slice(2,10)}`,
  };
  await appendRow(SHEET, n); return n;
}
