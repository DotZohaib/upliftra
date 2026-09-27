// server/routes/startups.js
import { Router } from 'express';
import { getStartups, getStartupById, createStartup, updateStartup, deleteStartup } from '../lib/sheets/startups.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  res.json({ success: true, startups: await getStartups() });
});
router.post('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  if (!['Startup/Founder','Admin','Super Admin'].includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Only founders can create startup listings.' });
  const s = await createStartup({ ...req.body, founderId: req.user.id, founderName: req.user.name });
  res.status(201).json({ success: true, startup: s });
});
router.patch('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const s = await getStartupById(req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Startup not found.' });
  if (s.founderId !== req.user.id && !['Admin','Super Admin'].includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Not authorized.' });
    
  const updates = { ...req.body };
  if (!['Admin','Super Admin'].includes(req.user.role)) {
    delete updates.founderId;
    delete updates.founderName;
  }
  
  await updateStartup(req.params.id, updates);
  res.json({ success: true });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  await deleteStartup(req.params.id);
  res.json({ success: true });
});
export default router;
