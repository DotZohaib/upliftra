// server/lib/sheets/credentials.js
// PRIVATE - Only accessed server-side. Never exposed to browser.
import {
  getSheetData, findRowByField, appendRow, updateRowById, generateId
} from './helpers.js';

const SHEET = 'Credentials';
export const CRED_HEADERS = ['credId','userId','email','passwordHash','createdAt','updatedAt'];

export async function getCredentialByEmail(email) {
  const { row } = await findRowByField(SHEET, 'email', email, 0);
  return row;
}
export async function getCredentialByUserId(userId) {
  const { row } = await findRowByField(SHEET, 'userId', userId, 0);
  return row;
}
export async function createCredential(userId, email, passwordHash) {
  const cred = {
    credId: generateId('CRD'),
    userId,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await appendRow(SHEET, cred);
  return cred;
}
export async function updateCredential(userId, passwordHash) {
  return updateRowById(SHEET, userId, {
    passwordHash, updatedAt: new Date().toISOString()
  }, 'userId');
}
