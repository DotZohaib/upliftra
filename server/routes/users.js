// server/routes/users.js
import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../lib/sheets/users.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
import { logAuditEvent } from '../lib/sheets/auditLogs.js';

const router = Router();

// GET /api/users (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  try {
    const users = await getAllUsers();
    const safe  = users.map(u => { const { passwordHash, ...rest } = u; return rest; });
    res.json({ success: true, users: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to fetch users.' });
  }
});

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  const { passwordHash, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

// PATCH /api/users/me
router.patch('/me', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const FORBIDDEN = ['id','email','role','passwordHash','createdAt','status','verificationStatus'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => !FORBIDDEN.includes(k))
  );
  try {
    await updateUser(req.user.id, updates);
    const updated = await getUserById(req.user.id);
    const { passwordHash, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to update profile.' });
  }
});

// GET /api/users/:id (public profile)
router.get('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  const { passwordHash, email, phone, dob, ...publicUser } = user;
  res.json({ success: true, user: publicUser });
});

// PATCH /api/users/:id (Admin: update any user)
router.patch('/:id', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const FORBIDDEN = ['id','passwordHash','createdAt'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => !FORBIDDEN.includes(k))
  );
  try {
    await updateUser(req.params.id, updates);
    await logAuditEvent({ action: 'admin_update_user', userId: req.user.id, userName: req.user.name,
      userRole: req.user.role, target: req.params.id, details: `Updated user fields: ${Object.keys(updates).join(', ')}` });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to update user.' });
  }
});

// DELETE /api/users/:id (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  if (req.params.id === req.user.id)
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  await deleteUser(req.params.id);
  await logAuditEvent({ action: 'admin_delete_user', userId: req.user.id, userName: req.user.name,
    userRole: req.user.role, target: req.params.id, details: 'User deleted by admin.' });
  res.json({ success: true });
});

export default router;
