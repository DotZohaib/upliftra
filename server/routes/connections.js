// server/routes/connections.js
import { Router } from 'express';
import { getConnections, createConnection, updateConnection } from '../lib/sheets/connections.js';
import { requireAuth } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const conns = await getConnections(req.user.id);
  res.json({ success: true, connections: conns });
});
router.post('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const conn = await createConnection({
    ...req.body,
    requesterId: req.user.id,
    requesterName: req.user.name,
    requesterRole: req.user.role,
    requesterAvatar: req.user.avatar,
    requesterTitle: req.user.title,
  });
  res.status(201).json({ success: true, connection: conn });
});
router.patch('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const connMod = await import('../lib/sheets/connections.js');
  const connections = await connMod.getConnections(req.user.id);
  const conn = connections.find(c => c.id === req.params.id);
  if (!conn) return res.status(404).json({ success: false, message: 'Connection not found or unauthorized.' });
  
  const isRequester = conn.requesterId === req.user.id;
  const isReceiver = conn.receiverId === req.user.id;
  
  const updates = { ...req.body };
  delete updates.requesterId;
  delete updates.receiverId;
  
  if (isRequester && !isReceiver && updates.status) {
    // Requester cannot accept their own request
    delete updates.status;
  }
  
  await updateConnection(req.params.id, updates);
  res.json({ success: true });
});
export default router;
