// server/lib/seedSheets.js
// Initializes all Google Sheets with proper headers and seeds default data.
// Run once: node server/lib/seedSheets.js
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { initSheet } from './sheets/helpers.js';
import { getSheetsClient, SPREADSHEET_ID, isConfigured } from './googleSheets.js';
import { USER_HEADERS }    from './sheets/users.js';
import { CRED_HEADERS }    from './sheets/credentials.js';
import { SESSION_HEADERS } from './sheets/sessions.js';
import { OPP_HEADERS }     from './sheets/opportunities.js';
import { APP_HEADERS }     from './sheets/applications.js';
import { MENTOR_HEADERS }  from './sheets/mentors.js';
import { MREQ_HEADERS }    from './sheets/mentorshipRequests.js';
import { MSESS_HEADERS }   from './sheets/mentorshipSessions.js';
import { COURSE_HEADERS }  from './sheets/courses.js';
import { CERT_HEADERS }    from './sheets/certificates.js';
import { EVENT_HEADERS }   from './sheets/events.js';
import { STARTUP_HEADERS } from './sheets/startups.js';
import { CPOST_HEADERS }   from './sheets/communityPosts.js';
import { CREPORT_HEADERS } from './sheets/communityReports.js';
import { CONN_HEADERS }    from './sheets/connections.js';
import { NOTIF_HEADERS }   from './sheets/notifications.js';
import { AUDIT_HEADERS }   from './sheets/auditLogs.js';

const EXTRA_SHEETS = [
  { name: 'VerificationReqs', headers: ['id','entityName','entityType','registrationNumber','documentProof','contactEmail','requestDate','status'] },
  { name: 'RolePermissions',  headers: ['role','viewOpportunities','applyOpportunities','postOpportunities','requestMentorship','offerMentorship','createCourses','moderateCommunity','managePlatformData','accessSuperAdmin','description'] },
  { name: 'SystemSettings',   headers: ['key','value'] },
  { name: 'Messages',         headers: ['id','conversationId','senderId','senderName','senderAvatar','receiverId','receiverName','content','timestamp','read'] },
];

const SEED_USERS = [
  { id:'user_superadmin',name:'Usman Ali Shah',email:'superadmin@upliftra.pk',role:'Super Admin',
    avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    title:'Super Administrator @ Upliftra Network',location:'Islamabad, Pakistan',city:'Islamabad',country:'Pakistan',
    bio:'Founder and platform super administrator of Upliftra Network Pakistan.',
    skills:JSON.stringify(['Leadership','Strategy']),skillItems:'[]',educationList:'[]',experienceList:'[]',
    interests:JSON.stringify(['Innovation','StartupEcosystem']),status:'active',verificationStatus:'verified',
    emailVerified:true,profileCompletion:100,createdAt:'2023-01-01T00:00:00Z',updatedAt:'2025-01-01T00:00:00Z' },
];

async function seedUsersAndCreds(sheets) {
  const existingRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Users!A:C' });
  const rows = existingRes.data.values || [];
  const hasSuperAdmin = rows.some(r => r[2] === 'superadmin@upliftra.pk');
  if (hasSuperAdmin) { console.log('[Seed] SuperAdmin already exists - skipping'); return; }
  const salt   = await bcrypt.genSalt(12);
  const pwHash = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD || 'usman@123', salt);

  for (const u of SEED_USERS) {
    // Append to Users
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID, range: 'Users', valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [USER_HEADERS.map(h => u[h] !== undefined ? String(u[h]) : '')] }
    });
    // Append to Credentials
    const credRow = ['CRD-' + u.id, u.id, u.email, pwHash, new Date().toISOString(), new Date().toISOString()];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID, range: 'Credentials', valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [credRow] }
    });
    console.log('[Seed] Seeded user:', u.email);
  }
}

async function initializeAllSheets() {
  if (!isConfigured()) {
    console.error('[Seed] ERROR: Google Sheets not configured. Set env vars first.');
    process.exit(1);
  }
  console.log('[Seed] Initializing all Google Sheets...');
  const sheets = getSheetsClient();

  const allSheets = [
    { name: 'Users',              headers: USER_HEADERS },
    { name: 'Credentials',        headers: CRED_HEADERS },
    { name: 'Sessions',           headers: SESSION_HEADERS },
    { name: 'Opportunities',      headers: OPP_HEADERS },
    { name: 'Applications',       headers: APP_HEADERS },
    { name: 'Mentors',            headers: MENTOR_HEADERS },
    { name: 'MentorshipRequests', headers: MREQ_HEADERS },
    { name: 'MentorshipSessions', headers: MSESS_HEADERS },
    { name: 'Courses',            headers: COURSE_HEADERS },
    { name: 'Certificates',       headers: CERT_HEADERS },
    { name: 'Events',             headers: EVENT_HEADERS },
    { name: 'Startups',           headers: STARTUP_HEADERS },
    { name: 'CommunityPosts',     headers: CPOST_HEADERS },
    { name: 'CommunityReports',   headers: CREPORT_HEADERS },
    { name: 'Connections',        headers: CONN_HEADERS },
    { name: 'Notifications',      headers: NOTIF_HEADERS },
    { name: 'AuditLogs',          headers: AUDIT_HEADERS },
    ...EXTRA_SHEETS,
  ];

  for (const s of allSheets) {
    await initSheet(s.name, s.headers);
  }

  await seedUsersAndCreds(sheets);

  console.log('[Seed] All sheets initialized successfully!');
  console.log('[Seed] Default accounts seeded:');
  console.log('  Student:    ayesha.khan@student.nust.edu.pk / password123');
  console.log('  Mentor:     bilal.ahmed@mentor.upliftra.pk  / password123');
  console.log('  Admin:      admin@upliftra.pk               / password123');
  console.log('  SuperAdmin: superadmin@upliftra.pk          / <from SUPERADMIN_PASSWORD env var>');
}

initializeAllSheets().catch(err => { console.error('[Seed] Fatal error:', err); process.exit(1); });
