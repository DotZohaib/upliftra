// server/middleware/auth.js
// JWT authentication middleware. Reads token from httpOnly cookie or Authorization header.
import jwt from 'jsonwebtoken';
import { getUserById } from '../lib/sheets/users.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_change_in_production';

export function signToken(payload, expiresIn) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn || process.env.JWT_EXPIRY || '24h' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

/** Express middleware — attaches req.user or returns 401. */
export async function requireAuth(req, res, next) {
  const token = req.cookies?.upliftra_token || extractBearerToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });

  // Fetch fresh user from Google Sheets (never trust JWT payload for role)
  try {
    const user = await getUserById(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Account not found.' });
    if (['suspended','disabled','deleted'].includes(user.status)) {
      return res.status(403).json({ success: false, message: 'Account access restricted. Contact support.' });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('[Auth] requireAuth error:', err.message);
    res.status(500).json({ success: false, message: 'Authentication service unavailable.' });
  }
}

/** Middleware — requires Admin or Super Admin role. */
export async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (!['Admin', 'Super Admin'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Administrator access required.' });
    }
    next();
  });
}

/** Middleware — requires Super Admin role only. */
export async function requireSuperAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Super Administrator access required.' });
    }
    next();
  });
}

/** Optional auth — attaches req.user if token valid, does NOT reject unauthenticated. */
export async function optionalAuth(req, res, next) {
  const token = req.cookies?.upliftra_token || extractBearerToken(req);
  if (!token) { next(); return; }
  const decoded = verifyToken(token);
  if (decoded) {
    try {
      const user = await getUserById(decoded.userId);
      if (user && !['suspended','disabled','deleted'].includes(user.status)) req.user = user;
    } catch {}
  }
  next();
}

function extractBearerToken(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 1 day default
};

export const COOKIE_OPTIONS_REMEMBER = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
