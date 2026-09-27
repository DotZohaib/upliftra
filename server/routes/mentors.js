// server/routes/mentors.js
import { Router } from 'express';
import { getMentors, getMentorById, createMentor, updateMentor, deleteMentor } from '../lib/sheets/mentors.js';
import { getMentorshipRequests, createMentorshipRequest, updateMentorshipRequest } from '../lib/sheets/mentorshipRequests.js';
import { getMentorshipSessions, createMentorshipSession, updateMentorshipSession } from '../lib/sheets/mentorshipSessions.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
import { createNotification } from '../lib/sheets/notifications.js';

const router = Router();

// Mentors
router.get('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const mentors = await getMentors();
  res.json({ success: true, mentors });
});
router.get('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const mentor = await getMentorById(req.params.id);
  if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });
  res.json({ success: true, mentor });
});
router.post('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  if (!['Mentor','Trainer','Admin','Super Admin'].includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Only mentors and trainers can create mentor profiles.' });
  const mentor = await createMentor({ ...req.body, userId: req.user.id });
  res.status(201).json({ success: true, mentor });
});
router.patch('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const mentor = await getMentorById(req.params.id);
  if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });
  if (mentor.userId !== req.user.id && !['Admin','Super Admin'].includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  
  const updates = { ...req.body };
  if (!['Admin','Super Admin'].includes(req.user.role)) {
    delete updates.userId;
  }
  
  await updateMentor(req.params.id, updates);
  res.json({ success: true });
});

// Mentorship Requests
router.get('/requests/all', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const requests = await getMentorshipRequests({ menteeId: req.user.id });
  res.json({ success: true, requests });
});
router.post('/requests', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const req_ = await createMentorshipRequest({ ...req.body, menteeId: req.user.id, menteeName: req.user.name, menteeAvatar: req.user.avatar });
  await createNotification({ userId: req.user.id, title: `Mentorship Requested with ${req_.mentorName}`,
    description: `Topic: ${req_.topic}`, type: 'mentorship', linkTo: '1-on-1-mentorship' });
  res.status(201).json({ success: true, request: req_ });
});
router.patch('/requests/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const reqMod = await import('../lib/sheets/mentorshipRequests.js');
  const existing = await reqMod.getMentorshipRequests({});
  const request = existing.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
  const isOwner = request.menteeId === req.user.id || request.mentorId === req.user.id;
  const isAdmin = ['Admin','Super Admin'].includes(req.user.role);
  if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
  
  const updates = { ...req.body };
  if (!isAdmin) {
    delete updates.menteeId;
    delete updates.mentorId;
  }
  
  await updateMentorshipRequest(req.params.id, updates);
  res.json({ success: true });
});

// Mentorship Sessions
router.get('/sessions/all', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const sessions = await getMentorshipSessions({ menteeId: req.user.id });
  res.json({ success: true, sessions });
});
router.post('/sessions', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  // Either the mentor or the mentee must be creating this session, and their ID must match the request.
  const isMentee = req.body.menteeId === req.user.id;
  const isMentor = req.body.mentorId === req.user.id;
  const isAdmin = ['Admin','Super Admin'].includes(req.user.role);
  
  if (!isMentee && !isMentor && !isAdmin) {
    return res.status(403).json({ success: false, message: 'You can only create sessions for yourself.' });
  }
  
  const sess = await createMentorshipSession(req.body);
  res.status(201).json({ success: true, session: sess });
});
router.patch('/sessions/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const sessMod = await import('../lib/sheets/mentorshipSessions.js');
  const existing = await sessMod.getMentorshipSessions({});
  const session = existing.find(r => r.id === req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
  const isOwner = session.menteeId === req.user.id || session.mentorId === req.user.id;
  const isAdmin = ['Admin','Super Admin'].includes(req.user.role);
  if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
  
  const updates = { ...req.body };
  if (!isAdmin) {
    delete updates.menteeId;
    delete updates.mentorId;
  }
  
  await updateMentorshipSession(req.params.id, updates);
  res.json({ success: true });
});

export default router;
