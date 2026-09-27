// server/routes/admin.js
import { Router } from 'express';
import { getAllUsers, updateUser } from '../lib/sheets/users.js';
import { getAuditLogs, logAuditEvent } from '../lib/sheets/auditLogs.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
import { getSheetData, appendRow } from '../lib/sheets/helpers.js';

const router = Router();

router.get('/audit-logs', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const logs = await getAuditLogs(parseInt(req.query.limit) || 200);
  res.json({ success: true, logs });
});
router.get('/stats', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const users     = await getAllUsers();
  const opps      = await getSheetData('Opportunities', 0);
  const apps      = await getSheetData('Applications', 0);
  const mentors   = await getSheetData('Mentors', 0);
  const courses   = await getSheetData('Courses', 0);
  const events    = await getSheetData('Events', 0);
  const posts     = await getSheetData('CommunityPosts', 0);
  const startups  = await getSheetData('Startups', 0);
  res.json({ success: true, stats: {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalOpportunities: opps.length,
    totalApplications: apps.length,
    totalMentors: mentors.length,
    totalCourses: courses.length,
    totalEvents: events.length,
    totalPosts: posts.length,
    totalStartups: startups.length,
    usersByRole: users.reduce((acc, u) => { acc[u.role] = (acc[u.role]||0)+1; return acc; }, {}),
  }});
});
router.patch('/users/:id/status', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const { status } = req.body;
  if (!['active','suspended','disabled'].includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  await updateUser(req.params.id, { status });
  await logAuditEvent({ action: 'admin_change_user_status', userId: req.user.id, userName: req.user.name,
    userRole: req.user.role, target: req.params.id, details: `Status changed to: ${status}` });
  res.json({ success: true });
});
router.patch('/users/:id/role', requireSuperAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const { role } = req.body;
  await updateUser(req.params.id, { role });
  await logAuditEvent({ action: 'super_admin_change_role', userId: req.user.id, userName: req.user.name,
    userRole: req.user.role, target: req.params.id, details: `Role changed to: ${role}` });
  res.json({ success: true });
});
router.get('/verification-requests', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const reqs = await getSheetData('VerificationReqs', 0);
  res.json({ success: true, requests: reqs });
});

export default router;
