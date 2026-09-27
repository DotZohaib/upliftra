// server/lib/sheets/courses.js
import { getSheetData, findRowByField, appendRow, updateRowById, generateId } from './helpers.js';
const SHEET = 'Courses';
export const COURSE_HEADERS = ['id','title','description','trainer','trainerRole','trainerId',
  'category','duration','level','modulesCount','enrolledCount','rating','thumbnail','modules',
  'status','certificateEligible'];
export async function getCourses() { return getSheetData(SHEET, 120000); }
export async function getCourseById(id) {
  const { row } = await findRowByField(SHEET, 'id', id, 120000); return row;
}
export async function createCourse(course) {
  const n = { ...course, id: generateId('CRS') };
  await appendRow(SHEET, n); return n;
}
export async function updateCourse(id, updates) { return updateRowById(SHEET, id, updates); }
