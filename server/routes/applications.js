// server/routes/applications.js
import { Router } from 'express';
import { getApplications, getApplicationById, createApplication,
  updateApplication, deleteApplication } from '../lib/sheets/applications.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
import { createNotification } from '../lib/sheets/notifications.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const isAdminUser = ['Admin','Super Admin'].includes(req.user.role);
  const isRecruiter = ['Recruiter','Company','Startup/Founder'].includes(req.user.role);
  
  if (isAdminUser) {
    const apps = await getApplications(req.query);
    return res.json({ success: true, applications: apps });
  }

  if (isRecruiter) {
    const oppMod = await import('../lib/sheets/opportunities.js');
    const myOpps = await oppMod.getOpportunities({ recruiterId: req.user.id });
    const myOppIds = myOpps.map(o => o.id);
    
    // They can see applications they submitted OR applications for their opportunities
    const allApps = await getApplications();
    const visibleApps = allApps.filter(a => a.applicantId === req.user.id || myOppIds.includes(a.opportunityId));
    
    // Apply query filters if any
    const filteredApps = visibleApps.filter(a => {
      let match = true;
      for (const [k, v] of Object.entries(req.query)) {
        if (a[k] !== v) match = false;
      }
      return match;
    });
    
    return res.json({ success: true, applications: filteredApps });
  }

  // Normal users
  const filters = { ...req.query, applicantId: req.user.id };
  const apps = await getApplications(filters);
  res.json({ success: true, applications: apps });
});
router.post('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const app = await createApplication({
    ...req.body,
    applicantId: req.user.id,
    applicantName: req.user.name,
    applicantEmail: req.user.email,
    applicantAvatar: req.user.avatar,
  });
  await createNotification({ userId: req.user.id, title: `Application Submitted`, 
    description: `Applied to ${app.opportunityTitle}`, type: 'application', linkTo: 'applications-tracker' });
  res.status(201).json({ success: true, application: app });
});
router.patch('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const existing = await getApplicationById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Application not found.' });
  
  const isOwner = existing.applicantId === req.user.id;
  const isAdmin = ['Admin','Super Admin'].includes(req.user.role);
  let isOpportunityOwner = false;
  
  if (['Recruiter','Company','Startup/Founder'].includes(req.user.role)) {
    const oppMod = await import('../lib/sheets/opportunities.js');
    const opp = await oppMod.getOpportunityById(existing.opportunityId);
    if (opp && opp.recruiterId === req.user.id) {
      isOpportunityOwner = true;
    }
  }

  if (!isOwner && !isAdmin && !isOpportunityOwner) {
    return res.status(403).json({ success: false, message: 'Not authorized to modify this application.' });
  }

  const updates = { ...req.body };
  if (!isAdmin) {
    delete updates.applicantId;
    delete updates.applicantName;
    delete updates.applicantEmail;
    delete updates.applicantAvatar;
    delete updates.opportunityId;
    delete updates.opportunityTitle;
  }
  
  if (isOwner && !isOpportunityOwner && !isAdmin) {
    // Applicants cannot change their own status to "Hired" or "Shortlisted", only recruiter can
    delete updates.status;
  }

  await updateApplication(req.params.id, updates);
  if (updates.status) {
    await createNotification({ userId: existing.applicantId, title: `Application Status: ${updates.status}`,
      description: `Your application for ${existing.opportunityTitle} is now "${updates.status}".`,
      type: 'application', linkTo: 'applications-tracker' });
  }
  res.json({ success: true });
});
router.delete('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const existing = await getApplicationById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Application not found.' });
  const isOwner = existing.applicantId === req.user.id;
  const isAdmin = ['Admin','Super Admin'].includes(req.user.role);
  if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
  await deleteApplication(req.params.id);
  res.json({ success: true });
});

export default router;
