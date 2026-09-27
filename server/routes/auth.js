// server/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
import { getUserByEmail, createUser, updateUser, emailExists } from '../lib/sheets/users.js';
import { getCredentialByEmail, createCredential, updateCredential } from '../lib/sheets/credentials.js';
import { createNotification } from '../lib/sheets/notifications.js';
import { logAuditEvent } from '../lib/sheets/auditLogs.js';
import { isConfigured } from '../lib/googleSheets.js';
import { sheetsUnavailable } from '../middleware/errorHandler.js';
import { signToken, verifyToken, COOKIE_OPTIONS, COOKIE_OPTIONS_REMEMBER, requireAuth } from '../middleware/auth.js';
import { generateId } from '../lib/sheets/helpers.js';

const router = Router();

// ── Rate limiting (in-memory, resets on server restart) ──────────────────────
const loginAttempts = new Map();
function checkRateLimit(email) {
  const entry = loginAttempts.get(email);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { allowed: false, waitSeconds: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }
  return { allowed: true };
}
function recordFailedAttempt(email) {
  const entry = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= 5) entry.lockedUntil = Date.now() + 15 * 60 * 1000;
  loginAttempts.set(email, entry);
  return entry;
}
function clearAttempts(email) { loginAttempts.delete(email); }

// POST /api/auth/register
router.post('/register', async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const { name, email, password, confirmPassword, role, city, country, phone, dob,
          gender, bio, title, terms, skills, careerGoals, institution } = req.body;

  if (!name?.trim() || !email?.trim() || !password || !role)
    return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
  if (!terms)
    return res.status(400).json({ success: false, message: 'You must accept the Terms of Service.' });
  if (password !== confirmPassword)
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  if (password.length < 8)
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: 'Invalid email address format.' });
  if (['Admin', 'Super Admin', 'Moderator'].includes(role))
    return res.status(403).json({ success: false, message: 'Privileged roles cannot be self-assigned during signup.' });

  const normEmail = email.toLowerCase().trim();
  if (await emailExists(normEmail))
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const userId = generateId('USR');
  const now    = new Date().toISOString();
  const newUser = {
    id: userId,
    name: name.trim(),
    email: normEmail,
    role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=047857&color=fff&size=200`,
    title: title?.trim() || `${role} @ Upliftra Network`,
    institution: institution || '',
    location: `${city || 'Pakistan'}, ${country || 'Pakistan'}`,
    city: city || 'Lahore',
    country: country || 'Pakistan',
    phone: phone || '',
    dob: dob || '',
    gender: gender || '',
    bio: bio?.trim() || `${role} member on Upliftra Network Pakistan.`,
    skills: JSON.stringify(Array.isArray(skills) ? skills : ['Communication', 'Collaboration']),
    skillItems: '[]',
    educationList: '[]',
    experienceList: '[]',
    interests: '[]',
    careerGoals: careerGoals || '',
    desiredJob: '',
    preferredIndustry: '',
    industry: '',
    portfolio: '',
    linkedin: '',
    github: '',
    website: '',
    accountType: 'individual',
    status: 'active',
    verificationStatus: 'unverified',
    emailVerified: true,
    profileCompletion: 40,
    createdAt: now,
    updatedAt: now,
  };

  await createUser(newUser);
  await createCredential(userId, normEmail, passwordHash);

  await createNotification({
    userId,
    title: `Welcome to Upliftra Network, ${newUser.name}! 🇵🇰`,
    description: `Your account as ${role} is created. Explore opportunities!`,
    type: 'system',
    linkTo: 'dashboard',
  });

  await logAuditEvent({ action: 'user_signup', userId, userName: name, userRole: role, target: userId,
    details: `New user registered as ${role}.` });

  const token = signToken({ userId, role });
  res.cookie('upliftra_token', token, COOKIE_OPTIONS);

  const safeUser = { ...newUser };
  res.status(201).json({ success: true, user: safeUser, message: 'Account created successfully!' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const { email, password, rememberMe } = req.body;
  if (!email?.trim() || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required.' });

  const normEmail = email.toLowerCase().trim();
  const rateCheck = checkRateLimit(normEmail);
  if (!rateCheck.allowed)
    return res.status(429).json({ success: false, isLocked: true,
      message: `Too many failed attempts. Try again in ${Math.ceil(rateCheck.waitSeconds / 60)} minute(s).` });

  const user = await getUserByEmail(normEmail);
  if (!user) {
    recordFailedAttempt(normEmail);
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (user.status === 'suspended')
    return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
  if (['disabled','deleted'].includes(user.status))
    return res.status(403).json({ success: false, message: 'Account access denied.' });

  const cred = await getCredentialByEmail(normEmail);
  let valid  = false;
  if (cred) {
    valid = await bcrypt.compare(password, cred.passwordHash);
  } else {
    // Fallback for seed users that might not have credentials yet
    valid = password === 'password123' || password === process.env.SUPERADMIN_PASSWORD;
    if (valid) {
      const hash = await bcrypt.hash(password, 12);
      await createCredential(user.id, normEmail, hash);
    }
  }

  if (!valid) {
    const entry = recordFailedAttempt(normEmail);
    const remaining = Math.max(0, 5 - entry.count);
    return res.status(401).json({ success: false,
      message: `Invalid email or password.${remaining > 0 ? ` ${remaining} attempt(s) remaining.` : ''}` });
  }

  clearAttempts(normEmail);
  await updateUser(user.id, { status: 'active' });

  await logAuditEvent({ action: 'user_login', userId: user.id, userName: user.name,
    userRole: user.role, details: 'Successful login.' });

  const expiry = rememberMe ? process.env.JWT_REMEMBER_ME_EXPIRY || '7d' : process.env.JWT_EXPIRY || '24h';
  const token  = signToken({ userId: user.id, role: user.role }, expiry);
  const cookieOpts = rememberMe ? COOKIE_OPTIONS_REMEMBER : COOKIE_OPTIONS;
  res.cookie('upliftra_token', token, cookieOpts);

  const safeUser = Object.fromEntries(Object.entries(user).filter(([k]) => k !== 'passwordHash'));
  res.json({ success: true, user: safeUser });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  // Optional audit log if token is valid
  const token = req.cookies?.upliftra_token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      await logAuditEvent({ action: 'user_logout', userId: decoded.userId, userName: 'User',
        userRole: decoded.role, details: 'User logged out.' }).catch(() => {});
    }
  }
  res.clearCookie('upliftra_token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/session
router.get('/session', requireAuth, (req, res) => {
  const safeUser = Object.fromEntries(Object.entries(req.user).filter(([k]) => k !== 'passwordHash'));
  res.json({ success: true, user: safeUser });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  if (!isConfigured()) return sheetsUnavailable(req, res);
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
  if (newPassword.length < 8)
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });

  const cred  = await getCredentialByEmail(req.user.email);
  const valid = cred ? await bcrypt.compare(currentPassword, cred.passwordHash) : currentPassword === 'password123';
  if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

  const hash = await bcrypt.hash(newPassword, 12);
  await updateCredential(req.user.id, hash);
  await logAuditEvent({ action: 'password_changed', userId: req.user.id, userName: req.user.name,
    userRole: req.user.role, details: 'Password changed successfully.' });
  res.json({ success: true, message: 'Password changed successfully.' });
});

export default router;
