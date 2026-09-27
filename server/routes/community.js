// server/routes/community.js
import { Router } from 'express';
import { getCommunityPosts, getCommunityPostById, createCommunityPost,
  updateCommunityPost, deleteCommunityPost, toggleUpvote, addComment } from '../lib/sheets/communityPosts.js';
import { getCommunityReports, createCommunityReport, updateCommunityReport } from '../lib/sheets/communityReports.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
import { generateId } from '../lib/sheets/helpers.js';

const router = Router();

router.get('/posts', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const isAdmin = ['Admin','Super Admin','Moderator'].includes(req.user.role);
  const posts = await getCommunityPosts({ includeHidden: isAdmin });
  res.json({ success: true, posts });
});
router.post('/posts', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const post = await createCommunityPost({
    ...req.body,
    authorId: req.user.id,
    authorName: req.user.name,
    authorAvatar: req.user.avatar,
    authorRole: req.user.role,
  });
  res.status(201).json({ success: true, post });
});
router.patch('/posts/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const post = await getCommunityPostById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
  const isOwner = post.authorId === req.user.id;
  const isMod   = ['Admin','Super Admin','Moderator'].includes(req.user.role);
  if (!isOwner && !isMod) return res.status(403).json({ success: false, message: 'Not authorized.' });
  
  const updates = { ...req.body };
  if (!isMod) {
    delete updates.authorId;
    delete updates.authorName;
    delete updates.authorRole;
    delete updates.isHidden;
  }
  
  await updateCommunityPost(req.params.id, updates);
  res.json({ success: true });
});
router.delete('/posts/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const post = await getCommunityPostById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
  const isOwner = post.authorId === req.user.id;
  const isMod   = ['Admin','Super Admin','Moderator'].includes(req.user.role);
  if (!isOwner && !isMod) return res.status(403).json({ success: false, message: 'Not authorized.' });
  await deleteCommunityPost(req.params.id);
  res.json({ success: true });
});
router.post('/posts/:id/upvote', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const result = await toggleUpvote(req.params.id, req.user.id);
  res.json({ success: true, ...result });
});
router.post('/posts/:id/comment', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const comment = await addComment(req.params.id, {
    authorId: req.user.id, authorName: req.user.name,
    authorAvatar: req.user.avatar, content: req.body.content,
  });
  res.status(201).json({ success: true, comment });
});

// Reports
router.get('/reports', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const reports = await getCommunityReports();
  res.json({ success: true, reports });
});
router.post('/reports', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const report = await createCommunityReport({ ...req.body, reportedBy: req.user.id, reporterName: req.user.name });
  res.status(201).json({ success: true, report });
});
router.patch('/reports/:id', requireAdmin, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  await updateCommunityReport(req.params.id, req.body);
  res.json({ success: true });
});

export default router;
