// server/routes/opportunities.js
import { Router } from 'express';
import { getOpportunities, getOpportunityById, createOpportunity,
  updateOpportunity, deleteOpportunity } from '../lib/sheets/opportunities.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
import { logAuditEvent } from '../lib/sheets/auditLogs.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const opps = await getOpportunities(req.query);
  res.json({ success: true, opportunities: opps });
});
router.get('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const opp = await getOpportunityById(req.params.id);
  if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found.' });
  res.json({ success: true, opportunity: opp });
});
router.post('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  if (!['Recruiter','Company','Startup/Founder','Admin','Super Admin'].includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Insufficient permissions to post opportunities.' });
  const opp = await createOpportunity({ ...req.body, recruiterId: req.user.id, status: 'draft' });
  await logAuditEvent({ action: 'create_opportunity', userId: req.user.id, userName: req.user.name,
    userRole: req.user.role, target: opp.id, details: `Created: ${opp.title}` });
  res.status(201).json({ success: true, opportunity: opp });
});
router.patch('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const existing = await getOpportunityById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Opportunity not found.' });
  const isOwner = existing.recruiterId === req.user.id;
  const isAdmin = ['Admin','Super Admin'].includes(req.user.role);
  if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized to edit this opportunity.' });
  
  const updates = { ...req.body };
  if (!isAdmin) {
    delete updates.status;
    delete updates.recruiterId;
  }
  
  await updateOpportunity(req.params.id, updates);
  res.json({ success: true });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  await deleteOpportunity(req.params.id);
  await logAuditEvent({ action: 'delete_opportunity', userId: req.user.id, userName: req.user.name,
    userRole: req.user.role, target: req.params.id, details: 'Opportunity deleted.' });
  res.json({ success: true });
});

export default router;
