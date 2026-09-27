// server/lib/sheets/users.js
import {
  getSheetData, findRowByField, appendRow, updateRowById,
  deleteRowByDataIndex, getSheetId, generateId, invalidateCache
} from './helpers.js';

const SHEET = 'Users';
const HEADERS = [
  'id','name','email','role','avatar','title','institution','location','city','country',
  'phone','dob','gender','bio','skills','skillItems','educationList','experienceList',
  'interests','careerGoals','desiredJob','preferredIndustry','industry',
  'portfolio','linkedin','github','website','accountType',
  'status','verificationStatus','emailVerified','profileCompletion','createdAt','updatedAt'
];
export const USER_HEADERS = HEADERS;

export async function getAllUsers() {
  return getSheetData(SHEET, 0); // no cache for users (auth-sensitive)
}
export async function getUserByEmail(email) {
  const { row } = await findRowByField(SHEET, 'email', email, 0);
  return row;
}
export async function getUserById(id) {
  const { row } = await findRowByField(SHEET, 'id', id, 0);
  return row;
}
export async function createUser(user) {
  const newUser = { ...user, id: user.id || generateId('USR') };
  await appendRow(SHEET, newUser);
  return newUser;
}
export async function updateUser(id, updates) {
  return updateRowById(SHEET, id, { ...updates, updatedAt: new Date().toISOString() });
}
export async function deleteUser(id) {
  const rows  = await getAllUsers();
  const idx   = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  const shId  = await getSheetId(SHEET);
  return deleteRowByDataIndex(SHEET, idx, shId);
}
export async function emailExists(email) {
  const user = await getUserByEmail(email);
  return !!user;
}
