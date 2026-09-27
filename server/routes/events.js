// server/routes/events.js
import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, registerForEvent } from '../lib/sheets/events.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  res.json({ success: true, events: await getEvents() });
});
router.get('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const ev = await getEventById(req.params.id);
  if (!ev) return res.status(404).json({ success: false, message: 'Event not found.' });
  res.json({ success: true, event: ev });
});
router.post('/', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const ev = await createEvent(req.body);
  res.status(201).json({ success: true, event: ev });
});
router.patch('/:id', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  await updateEvent(req.params.id, req.body);
  res.json({ success: true });
});
router.post('/:id/register', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const result = await registerForEvent(req.params.id, req.user.id);
  res.json({ success: true, ...result });
});
export default router;
