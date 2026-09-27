// server/lib/googleSheets.js
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '';

export function isConfigured() {
  return !!(
    process.env.GOOGLE_SPREADSHEET_ID &&
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  );
}

function createSheetsClient() {
  if (!isConfigured()) return null;
  try {
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
  } catch (err) {
    console.error('[Google Sheets] Failed to create auth client:', err.message);
    return null;
  }
}

let _sheetsClient = null;
export function getSheetsClient() {
  if (!_sheetsClient) _sheetsClient = createSheetsClient();
  return _sheetsClient;
}
export { SPREADSHEET_ID };
