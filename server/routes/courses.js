// server/routes/courses.js
import { Router } from 'express';
import { getCourses, getCourseById, createCourse, updateCourse } from '../lib/sheets/courses.js';
import { getCertificates, createCertificate } from '../lib/sheets/certificates.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  res.json({ success: true, courses: await getCourses() });
});
router.get('/certificates', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const certs = await getCertificates(req.user.id);
  res.json({ success: true, certificates: certs });
});
router.get('/:id', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const c = await getCourseById(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Course not found.' });
  res.json({ success: true, course: c });
});
router.post('/', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  if (!['Trainer','Admin','Super Admin'].includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Only trainers can create courses.' });
  const c = await createCourse({ ...req.body, trainerId: req.user.id, trainer: req.user.name });
  res.status(201).json({ success: true, course: c });
});
router.post('/:id/certificate', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const course = await getCourseById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  const cert = await createCertificate({
    userId: req.user.id, userName: req.user.name,
    courseId: course.id, courseName: course.title,
    trainerName: course.trainer || 'Upliftra Academy',
    verificationStatus: 'verified', hecAligned: true,
  });
  res.status(201).json({ success: true, certificate: cert });
});
export default router;
