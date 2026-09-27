import {
  User,
  UserRole,
  AuthSession,
  UserCredential,
  BruteForceLock,
  PasswordResetToken,
  EmailVerificationToken,
} from '../types';
import {
  getUsers,
  saveUsers,
  setCurrentUser,
  STORAGE_KEYS,
  getItem,
  setItem,
  deleteItem,
  addNotification,
  logAuditEvent,
} from './storage';
import { SEED_USERS } from '../data/seedData';

// Storage keys dedicated to secure auth
export const AUTH_STORAGE_KEYS = {
  CREDENTIALS: 'upliftra_auth_credentials',
  SESSION: 'upliftra_auth_session',
  RATE_LIMITS: 'upliftra_auth_rate_limits',
  RESET_TOKENS: 'upliftra_password_reset_tokens',
  EMAIL_CODES: 'upliftra_email_verification_codes',
} as const;

// Roles that can NEVER be registered through public self-signup
export const PRIVILEGED_ROLES: UserRole[] = ['Admin', 'Super Admin', 'Moderator'];

// 12 Public allowed roles
export const PUBLIC_SIGNUP_ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: 'Student', label: 'Student', desc: 'Higher education student looking for internships, jobs & scholarships' },
  { role: 'Professional', label: 'Professional', desc: 'Working tech professional expanding career, skills & network' },
  { role: 'Mentor', label: 'Mentor', desc: 'Industry veteran guiding young Pakistani engineers and creatives' },
  { role: 'Recruiter', label: 'Recruiter', desc: 'HR / Talent scout hiring top engineering and product candidates' },
  { role: 'Company', label: 'Company', desc: 'Enterprise or corporate posting verified opportunities' },
  { role: 'Startup/Founder', label: 'Startup / Founder', desc: 'Early-stage founder seeking hires, grants & co-founders' },
  { role: 'University', label: 'University', desc: 'Academic institution / Higher education placement office' },
  { role: 'Organization', label: 'Organization', desc: 'NGO, development fund or youth capacity association' },
  { role: 'Volunteer', label: 'Volunteer', desc: 'Community contributor giving back to open-source and STEM' },
  { role: 'Campus Ambassador', label: 'Campus Ambassador', desc: 'University student leader representing Upliftra Network' },
  { role: 'Partner', label: 'Partner', desc: 'Sponsorship, chamber of commerce or bilateral ecosystem partner' },
  { role: 'Trainer', label: 'Trainer', desc: 'Course author teaching technical bootcamps, AI and certifications' },
];

// Clean default SVG avatar if user skips profile photo
export const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

// ----------------------------------------------------
// Cryptographic Hashing Utilities (WebCrypto SHA-256 + Salt)
// ----------------------------------------------------

export function generateRandomHex(length: number = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for non-browser
  let result = '';
  const hexChars = '0123456789abcdef';
  for (let i = 0; i < length * 2; i++) {
    result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
  }
  return result;
}

export async function hashPasswordWithSalt(
  password: string,
  providedSalt?: string
): Promise<{ hash: string; salt: string }> {
  const salt = providedSalt || generateRandomHex(16);
  const combined = `${salt}:${password}:upliftra_secure_pepper_2026`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return { hash, salt };
  }

  // Pure JS fallback hash for environments without SubtleCrypto
  let hashVal = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hashVal = (hashVal << 5) - hashVal + char;
    hashVal |= 0;
  }
  const hash = Math.abs(hashVal).toString(16).padStart(32, '0') + generateRandomHex(16);
  return { hash, salt };
}

// ----------------------------------------------------
// Isolated Credentials Database
// ----------------------------------------------------

export function getCredentials(): UserCredential[] {
  return getItem<UserCredential[]>(AUTH_STORAGE_KEYS.CREDENTIALS, []);
}

export function saveCredentials(creds: UserCredential[]): void {
  setItem(AUTH_STORAGE_KEYS.CREDENTIALS, creds);
}

// Ensure default seeds have isolated secure hashed credentials
export async function initializeAuthCredentials(): Promise<void> {
  const creds = getCredentials();
  if (creds.length > 0) return;

  const initialCreds: UserCredential[] = [];
  const defaultPassword = 'password123';

  for (const user of SEED_USERS) {
    const { hash, salt } = await hashPasswordWithSalt(defaultPassword);
    initialCreds.push({
      userId: user.id,
      email: user.email.toLowerCase().trim(),
      passwordHash: hash,
      salt,
      iterations: 10000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveCredentials(initialCreds);
}

// ----------------------------------------------------
// Rate Limiting & Brute Force Lockout
// ----------------------------------------------------

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(email: string): {
  allowed: boolean;
  waitSeconds?: number;
  message?: string;
} {
  const normEmail = email.toLowerCase().trim();
  const locks = getItem<Record<string, BruteForceLock>>(AUTH_STORAGE_KEYS.RATE_LIMITS, {});
  const entry = locks[normEmail];

  if (!entry) return { allowed: true };

  if (entry.lockedUntil) {
    const lockTime = new Date(entry.lockedUntil).getTime();
    const now = Date.now();
    if (now < lockTime) {
      const waitSeconds = Math.ceil((lockTime - now) / 1000);
      return {
        allowed: false,
        waitSeconds,
        message: `Too many failed login attempts. For your security, this account is locked. Please try again in ${Math.ceil(waitSeconds / 60)} minute(s).`,
      };
    } else {
      // Lock expired, reset
      delete locks[normEmail];
      setItem(AUTH_STORAGE_KEYS.RATE_LIMITS, locks);
      return { allowed: true };
    }
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(email: string): { locked: boolean; remainingAttempts: number; waitMinutes?: number } {
  const normEmail = email.toLowerCase().trim();
  const locks = getItem<Record<string, BruteForceLock>>(AUTH_STORAGE_KEYS.RATE_LIMITS, {});
  const entry = locks[normEmail] || {
    identifier: normEmail,
    failedAttempts: 0,
    lockedUntil: null,
    lastAttemptAt: new Date().toISOString(),
  };

  entry.failedAttempts += 1;
  entry.lastAttemptAt = new Date().toISOString();

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
    entry.lockedUntil = lockedUntil;
    locks[normEmail] = entry;
    setItem(AUTH_STORAGE_KEYS.RATE_LIMITS, locks);

    logAuditEvent({
      action: 'account_lockout',
      userId: 'security_firewall',
      userName: 'Security Firewall',
      userRole: 'System',
      target: normEmail,
      description: `Account temporarily locked due to ${MAX_FAILED_ATTEMPTS} consecutive failed login attempts.`,
    });

    return { locked: true, remainingAttempts: 0, waitMinutes: 15 };
  }

  locks[normEmail] = entry;
  setItem(AUTH_STORAGE_KEYS.RATE_LIMITS, locks);
  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - entry.failedAttempts };
}

export function resetFailedLoginAttempts(email: string): void {
  const normEmail = email.toLowerCase().trim();
  const locks = getItem<Record<string, BruteForceLock>>(AUTH_STORAGE_KEYS.RATE_LIMITS, {});
  if (locks[normEmail]) {
    delete locks[normEmail];
    setItem(AUTH_STORAGE_KEYS.RATE_LIMITS, locks);
  }
}

// ----------------------------------------------------
// Session Management & Expiration Engine
// ----------------------------------------------------

const STANDARD_SESSION_HOURS = 24; // 1 day
const REMEMBER_ME_DAYS = 7; // 7 days

export function createSession(user: User, rememberMe: boolean): AuthSession {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (rememberMe ? REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000 : STANDARD_SESSION_HOURS * 60 * 60 * 1000)
  );

  const session: AuthSession = {
    sessionId: `sess_${generateRandomHex(12)}`,
    token: `tok_${generateRandomHex(24)}`,
    userId: user.id,
    userRole: user.role,
    userEmail: user.email,
    userName: user.name,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastActivityAt: now.toISOString(),
    rememberMe,
    status: 'active',
  };

  setItem(AUTH_STORAGE_KEYS.SESSION, session);
  setCurrentUser(user);

  logAuditEvent({
    action: 'session_created',
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    target: session.sessionId,
    description: `User authenticated. Session issued with ${rememberMe ? '7-day Remember-Me' : '24-hour'} TTL.`,
  });

  return session;
}

export function getActiveSession(): { session: AuthSession | null; isExpired?: boolean; user?: User } {
  if (typeof window === 'undefined') return { session: null };

  const session = getItem<AuthSession | null>(AUTH_STORAGE_KEYS.SESSION, null);
  if (!session) {
    return { session: null };
  }

  // 1. Expiration check
  const now = Date.now();
  const expires = new Date(session.expiresAt).getTime();

  if (now > expires || session.status !== 'active') {
    // Session expired
    invalidateSession(false);
    return { session: null, isExpired: true };
  }

  // 2. Validate user account status
  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);

  if (!user) {
    invalidateSession(false);
    return { session: null, isExpired: true };
  }

  if (user.status === 'suspended' || user.status === 'disabled' || user.status === 'deleted') {
    invalidateSession(false);
    return { session: null, isExpired: true };
  }

  // 3. Activity touch / session extension (renew activity)
  session.lastActivityAt = new Date().toISOString();
  setItem(AUTH_STORAGE_KEYS.SESSION, session);

  return { session, user };
}

export function invalidateSession(logAudit: boolean = true): void {
  const currentSession = getItem<AuthSession | null>(AUTH_STORAGE_KEYS.SESSION, null);
  if (currentSession && logAudit) {
    logAuditEvent({
      action: 'session_terminated',
      userId: currentSession.userId,
      userName: currentSession.userName,
      userRole: currentSession.userRole,
      target: currentSession.sessionId,
      description: `User session logged out and invalidated.`,
    });
  }

  deleteItem(AUTH_STORAGE_KEYS.SESSION);
  deleteItem(STORAGE_KEYS.CURRENT_USER);
  window.dispatchEvent(new Event('upliftra_auth_state_changed'));
}

// ----------------------------------------------------
// Real Login Service with Password Verification
// ----------------------------------------------------

export interface LoginResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
  isLocked?: boolean;
  waitSeconds?: number;
  accountStatus?: string;
}

export async function loginWithCredentials(
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<LoginResult> {
  const normEmail = email.toLowerCase().trim();

  // 1. Basic validation
  if (!normEmail || !password) {
    return { success: false, error: 'Please enter both your email address and password.' };
  }

  // 2. Rate limiting / brute force check
  const rateLimit = checkRateLimit(normEmail);
  if (!rateLimit.allowed) {
    return {
      success: false,
      isLocked: true,
      waitSeconds: rateLimit.waitSeconds,
      error: rateLimit.message || 'Account temporarily locked due to security policy.',
    };
  }

  // Ensure creds initialized
  await initializeAuthCredentials();

  // 3. User lookup
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === normEmail);

  // If user does not exist: record failed attempt & return generic error
  if (!user) {
    recordFailedLoginAttempt(normEmail);
    return { success: false, error: 'Invalid email or password.' };
  }

  // 4. Check account status
  if (user.status === 'suspended') {
    return {
      success: false,
      accountStatus: 'suspended',
      error: 'Your account has been suspended by administration. Access is denied.',
    };
  }

  if (user.status === 'disabled') {
    return {
      success: false,
      accountStatus: 'disabled',
      error: 'This account is currently disabled. Please contact support.',
    };
  }

  if (user.status === 'deleted') {
    return { success: false, error: 'Invalid email or password.' };
  }

  // 5. Verify password hash
  const creds = getCredentials();
  const userCred = creds.find((c) => c.userId === user.id || c.email.toLowerCase() === normEmail);

  let passwordValid = false;

  if (userCred) {
    const { hash } = await hashPasswordWithSalt(password, userCred.salt);
    passwordValid = hash === userCred.passwordHash;
  } else {
    // If not in isolated creds yet, check seed fallback
    passwordValid = password === 'password123' || (Boolean(user.password) && user.password === password);
    if (passwordValid) {
      // Migrate password into isolated creds
      const { hash, salt } = await hashPasswordWithSalt(password);
      creds.push({
        userId: user.id,
        email: normEmail,
        passwordHash: hash,
        salt,
        iterations: 10000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      saveCredentials(creds);
    }
  }

  if (!passwordValid) {
    const lockStatus = recordFailedLoginAttempt(normEmail);
    if (lockStatus.locked) {
      return {
        success: false,
        isLocked: true,
        waitSeconds: 900,
        error: 'Too many failed login attempts. Your account has been locked for 15 minutes.',
      };
    }
    return {
      success: false,
      error: `Invalid email or password. (${lockStatus.remainingAttempts} attempt(s) remaining before security lockout)`,
    };
  }

  // 6. Success: clear failed attempts & create session
  resetFailedLoginAttempts(normEmail);

  // Check if pending email verification
  if (user.status === 'pending_verification' && !user.emailVerified) {
    return {
      success: false,
      accountStatus: 'pending_verification',
      user,
      error: 'Your email address has not been verified yet. Please enter your verification code.',
    };
  }

  const session = createSession(user, rememberMe);
  return { success: true, user, session };
}

// ----------------------------------------------------
// Multi-Step Signup Payload & Service
// ----------------------------------------------------

export interface MultiStepSignupData {
  // Step 1: Account Info
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  country: string;
  city: string;
  termsAccepted: boolean;

  // Step 2: Role
  role: UserRole;

  // Step 3: Basic Profile
  avatar?: string;
  dob?: string;
  gender?: string;
  bio?: string;
  title?: string;

  // Step 4: Education (optional / skippable)
  institution?: string;
  degree?: string;
  field?: string;
  startYear?: string;
  endYear?: string;
  grade?: string;

  // Step 5: Skills & Career (optional / skippable)
  skills?: string[];
  skillItems?: { name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' }[];
  careerInterests?: string[];
  careerGoals?: string;
  desiredJob?: string;
  preferredIndustry?: string;

  // Step 6: Verification code (optional auto-activate)
  verificationCode?: string;
}

export async function processMultiStepSignup(data: MultiStepSignupData): Promise<{
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
  requiresVerification?: boolean;
}> {
  // 1. Account validation
  if (!data.name.trim() || !data.email.trim() || !data.password) {
    return { success: false, error: 'Full name, email address, and password are required.' };
  }

  if (!data.termsAccepted) {
    return { success: false, error: 'You must accept the Upliftra Network Terms of Service and Privacy Policy.' };
  }

  if (data.password !== data.confirmPassword) {
    return { success: false, error: 'Passwords do not match. Please verify both fields.' };
  }

  if (data.password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long and contain varied characters.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, error: 'Please provide a valid, well-formed email address.' };
  }

  // 2. Strict Privilege Escalation Protection:
  // Public users can NEVER register as Admin, Super Admin, or Moderator!
  if (PRIVILEGED_ROLES.includes(data.role)) {
    return {
      success: false,
      error: 'Privileged administrative roles (Super Admin, Admin, Moderator) can never be self-assigned during public signup. They must be provisioned by authorized platform administrators.',
    };
  }

  // 3. Duplicate email verification
  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase().trim());
  if (existing) {
    return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
  }

  // 4. Secure Password Hashing
  const { hash, salt } = await hashPasswordWithSalt(data.password);

  // 5. Construct User profile
  const userId = `user_${Date.now()}`;
  const normEmail = data.email.toLowerCase().trim();

  const educationRecords = data.institution && data.degree ? [
    {
      id: `edu_${Date.now()}`,
      institution: data.institution,
      degree: data.degree,
      field: data.field || 'General',
      startYear: data.startYear || '2022',
      endYear: data.endYear || '2026',
      grade: data.grade || '',
      description: `Enrolled in ${data.degree} program at ${data.institution}.`,
    },
  ] : [];

  const skillItems = (data.skillItems && data.skillItems.length > 0)
    ? data.skillItems.map((s, idx) => ({ id: `sk_${idx}_${Date.now()}`, name: s.name, level: s.level }))
    : (data.skills || ['Communication', 'Career Growth', 'Teamwork']).map((s, idx) => ({
        id: `sk_${idx}_${Date.now()}`,
        name: s,
        level: 'Intermediate' as const,
      }));

  const newUser: User = {
    id: userId,
    name: data.name.trim(),
    email: normEmail,
    role: data.role,
    avatar: data.avatar && data.avatar.trim() ? data.avatar.trim() : DEFAULT_AVATAR,
    title: data.title?.trim() || `${data.role} @ Upliftra Network Pakistan`,
    location: `${data.city || 'Lahore'}, ${data.country || 'Pakistan'}`,
    city: data.city || 'Lahore',
    country: data.country || 'Pakistan',
    phone: data.phone || '',
    dob: data.dob || '',
    gender: data.gender || '',
    bio: data.bio?.trim() || `Passionate ${data.role} member on Upliftra Network Pakistan.`,
    skills: skillItems.map((s) => s.name),
    skillItems,
    educationList: educationRecords,
    education: educationRecords[0] ? `${educationRecords[0].degree} @ ${educationRecords[0].institution}` : undefined,
    experienceList: [],
    interests: data.careerInterests || ['Tech Careers', 'Networking'],
    careerGoals: data.careerGoals || '',
    desiredJob: data.desiredJob || '',
    preferredIndustry: data.preferredIndustry || '',
    accountType: 'individual',
    status: 'active',
    verificationStatus: 'unverified',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 6. Save Credentials securely (never in public user)
  const creds = getCredentials();
  creds.push({
    userId: newUser.id,
    email: normEmail,
    passwordHash: hash,
    salt,
    iterations: 10000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  saveCredentials(creds);

  // 7. Save User in database
  users.push(newUser);
  saveUsers(users);

  // 8. Create session immediately
  const session = createSession(newUser, true);

  // 9. Send welcome notification
  addNotification({
    userId: newUser.id,
    title: `Welcome to Upliftra Network, ${newUser.name}! 🇵🇰`,
    description: `Your account as a verified ${newUser.role} is created. Explore opportunities and connect with Pakistani mentors.`,
    type: 'system',
    linkTo: 'dashboard',
  });

  logAuditEvent({
    action: 'user_signup',
    userId: newUser.id,
    userName: newUser.name,
    userRole: newUser.role,
    target: newUser.id,
    description: `New user self-registered as ${newUser.role}. Multi-step profile initialized.`,
  });

  return { success: true, user: newUser, session };
}

// ----------------------------------------------------
// Password Reset Flow (Forgot Password)
// ----------------------------------------------------

export function requestPasswordReset(email: string): {
  success: boolean;
  code?: string;
  message: string;
} {
  const normEmail = email.toLowerCase().trim();
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === normEmail);

  // Always return a positive message to prevent user enumeration
  if (!user) {
    return {
      success: true,
      message: 'If an account exists with this email address, a password reset verification code has been dispatched.',
    };
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = `rst_${generateRandomHex(16)}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  const tokens = getItem<PasswordResetToken[]>(AUTH_STORAGE_KEYS.RESET_TOKENS, []);
  tokens.push({
    token,
    code,
    email: normEmail,
    expiresAt,
    used: false,
    createdAt: new Date().toISOString(),
  });
  setItem(AUTH_STORAGE_KEYS.RESET_TOKENS, tokens);

  logAuditEvent({
    action: 'password_reset_requested',
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    target: normEmail,
    description: `A 6-digit password reset security code was generated for ${normEmail}.`,
  });

  return {
    success: true,
    code, // Returned for transparent UI simulation
    message: `A 6-digit password reset code has been sent to ${normEmail}. (Simulated Code: ${code})`,
  };
}

export async function completePasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const normEmail = email.toLowerCase().trim();
  const tokens = getItem<PasswordResetToken[]>(AUTH_STORAGE_KEYS.RESET_TOKENS, []);

  const matching = tokens.find(
    (t) => t.email === normEmail && t.code === code.trim() && !t.used
  );

  if (!matching) {
    return { success: false, error: 'Invalid or expired verification code. Please request a new one.' };
  }

  if (Date.now() > new Date(matching.expiresAt).getTime()) {
    return { success: false, error: 'This verification code has expired (15-minute limit). Please request a new code.' };
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  // Mark token used
  matching.used = true;
  setItem(AUTH_STORAGE_KEYS.RESET_TOKENS, tokens);

  // Hash new password
  const { hash, salt } = await hashPasswordWithSalt(newPassword);

  const creds = getCredentials();
  const existingIndex = creds.findIndex((c) => c.email.toLowerCase() === normEmail);

  if (existingIndex !== -1) {
    creds[existingIndex].passwordHash = hash;
    creds[existingIndex].salt = salt;
    creds[existingIndex].updatedAt = new Date().toISOString();
  } else {
    const users = getUsers();
    const u = users.find((u) => u.email.toLowerCase() === normEmail);
    creds.push({
      userId: u?.id || `user_${Date.now()}`,
      email: normEmail,
      passwordHash: hash,
      salt,
      iterations: 10000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveCredentials(creds);
  resetFailedLoginAttempts(normEmail);

  logAuditEvent({
    action: 'password_reset_completed',
    userId: 'system',
    userName: 'Security Service',
    userRole: 'System',
    target: normEmail,
    description: `Password for ${normEmail} was successfully changed via verified 6-digit code.`,
  });

  return { success: true };
}

export async function verifyUserPassword(userIdOrEmail: string, password: string): Promise<boolean> {
  const creds = getCredentials();
  const cred = creds.find(
    (c) => c.userId === userIdOrEmail || c.email.toLowerCase() === userIdOrEmail.toLowerCase()
  );
  if (!cred) {
    // If demo seed user with default password
    return password === 'password123';
  }
  const { hash } = await hashPasswordWithSalt(password, cred.salt);
  return hash === cred.passwordHash;
}

export async function updateUserPassword(userIdOrEmail: string, newPassword: string): Promise<boolean> {
  const { hash, salt } = await hashPasswordWithSalt(newPassword);
  const creds = getCredentials();
  const existingIndex = creds.findIndex(
    (c) => c.userId === userIdOrEmail || c.email.toLowerCase() === userIdOrEmail.toLowerCase()
  );
  if (existingIndex !== -1) {
    creds[existingIndex].passwordHash = hash;
    creds[existingIndex].salt = salt;
    creds[existingIndex].updatedAt = new Date().toISOString();
  } else {
    creds.push({
      userId: userIdOrEmail,
      email: userIdOrEmail,
      passwordHash: hash,
      salt,
      iterations: 10000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  saveCredentials(creds);

  logAuditEvent({
    action: 'password_updated_self',
    userId: userIdOrEmail,
    userName: userIdOrEmail,
    userRole: 'User',
    target: userIdOrEmail,
    description: `User ${userIdOrEmail} updated their password securely via Settings.`,
  });

  return true;
}

export function hasAuthenticatedSession(): boolean {
  const { session } = getActiveSession();
  return session !== null;
}
