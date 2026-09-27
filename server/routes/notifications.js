// server/routes/notifications.js
import { Router } from 'express';
import { getNotifications, createNotification, markNotificationRead, markAllRead } from '../lib/sheets/notifications.js';
import { requireAuth } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const notifs = await getNotifications(req.user.id);
  res.json({ success: true, notifications: notifs });
});
router.post('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const n = await createNotification({ ...req.body, userId: req.user.id });
  res.status(201).json({ success: true, notification: n });
});
router.patch('/:id/read', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const notifMod = await import('../lib/sheets/notifications.js');
  const notifs = await notifMod.getNotifications(req.user.id);
  const notif = notifs.find(n => n.id === req.params.id);
  if (!notif) return res.status(404).json({ success: false, message: 'Notification not found or unauthorized.' });
  
  await markNotificationRead(req.params.id);
  res.json({ success: true });
});
router.post('/read-all', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  await markAllRead(req.user.id);
  res.json({ success: true });
});
export default router;
