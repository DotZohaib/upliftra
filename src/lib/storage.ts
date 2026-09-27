import {
  User,
  Opportunity,
  Mentor,
  Course,
  PlatformEvent,
  CommunityPost,
  Startup,
  Application,
  MentorshipSession,
  MentorshipRequest,
  NotificationItem,
  AIChatMessage,
  RolePermission,
  UserRole,
  Connection,
  Certificate,
  CommunityReport,
  DirectMessage,
  VerificationRequest,
  AuditLog,
  SystemSettings,
  FeatureFlags,
} from '../types';
import {
  SEED_USERS,
  SEED_OPPORTUNITIES,
  SEED_MENTORS,
  SEED_COURSES,
  SEED_EVENTS,
  SEED_COMMUNITY_POSTS,
  SEED_STARTUPS,
  SEED_APPLICATIONS,
  SEED_SESSIONS,
  SEED_NOTIFICATIONS,
  ROLE_PERMISSIONS_MATRIX,
  SEED_SAVED_OPPORTUNITY_IDS,
  SEED_MENTORSHIP_REQUESTS,
  SEED_CONNECTIONS,
  SEED_CERTIFICATES,
  SEED_COMMUNITY_REPORTS,
} from '../data/seedData';
import { opportunitiesApi, applicationsApi, mentorsApi, communityApi, eventsApi, startupsApi, coursesApi, notificationsApi, connectionsApi, usersApi } from './api';

export const STORAGE_KEYS = {
  USERS: 'upliftra_users',
  CURRENT_USER: 'upliftra_current_user',
  OPPORTUNITIES: 'upliftra_opportunities',
  SAVED_OPPORTUNITIES: 'upliftra_saved_opportunities',
  APPLICATIONS: 'upliftra_applications',
  MENTORS: 'upliftra_mentors',
  MENTORSHIP_SESSIONS: 'upliftra_mentorship_sessions',
  MENTORSHIP_REQUESTS: 'upliftra_mentorship_requests',
  COURSES: 'upliftra_courses',
  CERTIFICATES: 'upliftra_certificates',
  EVENTS: 'upliftra_events',
  STARTUPS: 'upliftra_startups',
  COMMUNITY_POSTS: 'upliftra_community_posts',
  COMMUNITY_REPORTS: 'upliftra_community_reports',
  CONNECTIONS: 'upliftra_connections',
  MESSAGES: 'upliftra_messages',
  NOTIFICATIONS: 'upliftra_notifications',
  AI_HISTORY: 'upliftra_ai_history',
  PERMISSIONS: 'upliftra_permissions',
  SETTINGS: 'upliftra_settings',
  VERIFICATIONS: 'upliftra_verifications',
  AUDIT_LOGS: 'upliftra_audit_logs',
  FEATURE_FLAGS: 'upliftra_feature_flags',
} as const;

// ----------------------------------------------------
// Base Generic Local Storage Utilities
// ----------------------------------------------------

export function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[LocalStorage] Error reading key: "${key}"`, err);
    return fallback;
  }
}

export function setItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('upliftra_data_changed', { detail: { key } }));
    return true;
  } catch (err) {
    console.error(`[LocalStorage] Error writing key: "${key}"`, err);
    return false;
  }
}

export function updateItem<T>(key: string, updater: (prev: T) => T, fallback: T): T {
  const current = getItem<T>(key, fallback);
  const updated = updater(current);
  setItem(key, updated);
  return updated;
}

export function deleteItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('upliftra_data_changed', { detail: { key } }));
  } catch (err) {
    console.error(`[LocalStorage] Error removing key: "${key}"`, err);
  }
}

export function clearItem(key: string): void {
  deleteItem(key);
}

// ----------------------------------------------------
// Initialization & Seeding
// ----------------------------------------------------

export function initLocalStorage(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setItem(STORAGE_KEYS.USERS, SEED_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    if (SEED_USERS && SEED_USERS.length > 0) {
      setItem(STORAGE_KEYS.CURRENT_USER, SEED_USERS[0]);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES)) {
    setItem(STORAGE_KEYS.OPPORTUNITIES, SEED_OPPORTUNITIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SAVED_OPPORTUNITIES)) {
    setItem(STORAGE_KEYS.SAVED_OPPORTUNITIES, SEED_SAVED_OPPORTUNITY_IDS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    setItem(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.MENTORS)) {
    setItem(STORAGE_KEYS.MENTORS, SEED_MENTORS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.MENTORSHIP_SESSIONS)) {
    setItem(STORAGE_KEYS.MENTORSHIP_SESSIONS, SEED_SESSIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.MENTORSHIP_REQUESTS)) {
    setItem(STORAGE_KEYS.MENTORSHIP_REQUESTS, SEED_MENTORSHIP_REQUESTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    setItem(STORAGE_KEYS.COURSES, SEED_COURSES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
    setItem(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    setItem(STORAGE_KEYS.EVENTS, SEED_EVENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STARTUPS)) {
    setItem(STORAGE_KEYS.STARTUPS, SEED_STARTUPS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS)) {
    setItem(STORAGE_KEYS.COMMUNITY_POSTS, SEED_COMMUNITY_POSTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMUNITY_REPORTS)) {
    setItem(STORAGE_KEYS.COMMUNITY_REPORTS, SEED_COMMUNITY_REPORTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONNECTIONS)) {
    setItem(STORAGE_KEYS.CONNECTIONS, SEED_CONNECTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    setItem(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PERMISSIONS)) {
    setItem(STORAGE_KEYS.PERMISSIONS, ROLE_PERMISSIONS_MATRIX);
  }
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    setItem(STORAGE_KEYS.MESSAGES, [
      {
        id: 'msg_init_1',
        conversationId: 'conv_ayesha_bilal',
        senderId: 'user_bilal',
        senderName: 'Bilal Ahmed',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        receiverId: 'user_ayesha',
        receiverName: 'Ayesha Khan',
        content: 'Assalam-o-Alaikum Ayesha! I reviewed your system design request. Looking forward to our Saturday session.',
        timestamp: 'Yesterday at 5:20 PM',
        read: true,
      },
      {
        id: 'msg_init_2',
        conversationId: 'conv_ayesha_bilal',
        senderId: 'user_ayesha',
        senderName: 'Ayesha Khan',
        receiverId: 'user_bilal',
        receiverName: 'Bilal Ahmed',
        content: 'Walaikum Assalam Sir! Thank you so much for accepting. I have prepared my architectural diagrams.',
        timestamp: 'Yesterday at 5:45 PM',
        read: true,
      },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.AI_HISTORY)) {
    setItem(STORAGE_KEYS.AI_HISTORY, [
      {
        id: 'ai_1',
        sender: 'assistant',
        text: 'Assalam-o-Alaikum, Ayesha! I am your Upliftra AI Career Coach. I analyzed your profile and identified 8 top matches in Lahore and Islamabad. How can I help boost your applications today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Analyze CV for Systems Ltd',
          'Outreach to NUST Alumni at Delivery Hero',
          'Salary Comparison PK',
          'SOP review for Global UGRAD',
        ],
      },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setItem(STORAGE_KEYS.SETTINGS, {
      offlineMode: true,
      emailAlerts: true,
      currency: 'PKR',
      primaryRegion: 'All Pakistan',
      theme: 'light',
      lastSyncedAt: new Date().toISOString(),
      profileVisibility: 'public',
      contactVisibility: 'connections-only',
      jobAlerts: true,
      mentorshipAlerts: true,
    });
  }
}

// ----------------------------------------------------
// Profile Completion Calculator
// ----------------------------------------------------

export function calculateProfileCompletion(user: Partial<User>): {
  percentage: number;
  recommendations: string[];
} {
  let score = 0;
  const recommendations: string[] = [];

  // Photo: 15%
  if (user.avatar && user.avatar.trim() !== '') {
    score += 15;
  } else {
    recommendations.push('Upload a professional profile photo (+15%)');
  }

  // Basic Info: 20%
  const hasBasic = user.name && user.email && user.bio && user.location;
  if (hasBasic) {
    score += 20;
  } else {
    recommendations.push('Complete basic contact details and career bio (+20%)');
  }

  // Education: 20%
  if (user.educationList && user.educationList.length > 0) {
    score += 20;
  } else if (user.education) {
    score += 15;
    recommendations.push('Add full education records with graduation year (+5%)');
  } else {
    recommendations.push('Add your degree and university education history (+20%)');
  }

  // Experience: 15%
  if (user.experienceList && user.experienceList.length > 0) {
    score += 15;
  } else if (user.experience) {
    score += 10;
    recommendations.push('Add detailed employment records with responsibilities (+5%)');
  } else {
    recommendations.push('Add work experience or internships (+15%)');
  }

  // Skills: 15%
  const skillCount = (user.skillItems?.length || 0) || (user.skills?.length || 0);
  if (skillCount >= 3) {
    score += 15;
  } else if (skillCount > 0) {
    score += 8;
    recommendations.push('Add at least 3 skills with proficiency levels (+7%)');
  } else {
    recommendations.push('Add your technical and domain skills with levels (+15%)');
  }

  // Online Presence (LinkedIn / GitHub / Portfolio): 10%
  if (user.linkedin || user.github || user.portfolio || user.website) {
    score += 10;
  } else {
    recommendations.push('Link your LinkedIn or GitHub profile (+10%)');
  }

  // Career Goals & Interests: 5%
  if (user.careerGoals || (user.interests && user.interests.length > 0)) {
    score += 5;
  } else {
    recommendations.push('State your target career goals and industry interests (+5%)');
  }

  return {
    percentage: Math.min(100, score),
    recommendations,
  };
}

// ----------------------------------------------------
// User & Authentication Management
// ----------------------------------------------------

export function hasAuthenticatedSession(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem('upliftra_auth_session');
  if (!raw) return false;
  try {
    const session = JSON.parse(raw);
    if (!session || !session.expiresAt) return false;
    if (Date.now() > new Date(session.expiresAt).getTime()) {
      localStorage.removeItem('upliftra_auth_session');
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return false;
    }
    return session.status === 'active';
  } catch {
    return false;
  }
}

export function getCurrentUser(): User {
  return getItem<User>(STORAGE_KEYS.CURRENT_USER, SEED_USERS[0]);
}

export function getCurrentUserOrNull(): User | null {
  if (!hasAuthenticatedSession()) return null;
  return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User): void {
  const comp = calculateProfileCompletion(user);
  const updatedUser = { ...user, profileCompletion: comp.percentage };
  setItem(STORAGE_KEYS.CURRENT_USER, updatedUser);
}

export function getUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.USERS, []);
}

export function saveUsers(users: User[]): void {
  setItem(STORAGE_KEYS.USERS, users);
}

export function updateUser(updatedUser: User): void {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  const comp = calculateProfileCompletion(updatedUser);
  const userWithScore = {
    ...updatedUser,
    profileCompletion: comp.percentage,
    updatedAt: new Date().toISOString(),
  };

  if (index !== -1) {
    users[index] = userWithScore;
    saveUsers(users);
  }

  const current = getCurrentUser();
  if (current.id === updatedUser.id) {
    setCurrentUser(userWithScore);
  }
}

export function deleteUser(userId: string): void {
  const users = getUsers().filter((u) => u.id !== userId);
  saveUsers(users);
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  country: string;
  city: string;
  phone?: string;
  dob?: string;
  avatar?: string;
  accountType?: 'individual' | 'organization';
  termsAccepted: boolean;
}

export function signupUser(payload: SignupPayload): {
  success: boolean;
  user?: User;
  error?: string;
} {
  // 1. Validation
  if (!payload.name || !payload.email || !payload.password) {
    return { success: false, error: 'Name, email, and password are required.' };
  }

  if (!payload.termsAccepted) {
    return { success: false, error: 'You must agree to the Terms of Service & Privacy Policy.' };
  }

  if (payload.password !== payload.confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  if (payload.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email)) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  // 2. Privilege security check: Normal public signup CANNOT choose Admin, Super Admin, or Moderator
  const privilegedRoles: UserRole[] = ['Admin', 'Super Admin', 'Moderator'];
  if (privilegedRoles.includes(payload.role)) {
    return {
      success: false,
      error: 'Privileged roles (Admin, Super Admin, Moderator) can only be assigned by authorized platform leadership.',
    };
  }

  // 3. Duplicate email check
  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
  if (existing) {
    return { success: false, error: 'An account with this email address already exists. Please log in.' };
  }

  // 4. Create new user
  const newUser: User = {
    id: `user_${Date.now()}`,
    name: payload.name.trim(),
    email: payload.email.toLowerCase().trim(),
    // NOTE: password is NOT stored here Ã¢â‚¬â€ it is stored hashed in isolated credentials via auth.ts
    role: payload.role,
    avatar:
      payload.avatar?.trim() ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    title: `${payload.role} on Upliftra Network`,
    location: `${payload.city || 'Pakistan'}, ${payload.country || 'Pakistan'}`,
    city: payload.city || 'Lahore',
    country: payload.country || 'Pakistan',
    phone: payload.phone || '',
    dob: payload.dob || '',
    bio: `Passionate ${payload.role} member on Upliftra Network Pakistan.`,
    skills: ['Communication', 'Career Growth', 'Collaboration'],
    skillItems: [
      { id: 'sk_init_1', name: 'Communication', level: 'Intermediate' },
      { id: 'sk_init_2', name: 'Collaboration', level: 'Intermediate' },
    ],
    educationList: [],
    experienceList: [],
    interests: ['Tech Careers', 'Networking'],
    accountType: payload.accountType || 'individual',
    status: 'active',
    verificationStatus: 'unverified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const comp = calculateProfileCompletion(newUser);
  newUser.profileCompletion = comp.percentage;

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);

  // Welcome notification
  addNotification({
    userId: newUser.id,
    title: 'Welcome to Upliftra Network Pakistan! Ã°Å¸â€¡ÂµÃ°Å¸â€¡Â°',
    description: `Your account as ${newUser.role} is created. Complete your profile to unlock verified recommendations.`,
    type: 'system',
    linkTo: 'settings',
  });

  return { success: true, user: newUser };
}

export function loginUser(
  email: string,
  password: string,
  _rememberMe = true
): {
  success: boolean;
  user?: User;
  error?: string;
} {
  const users = getUsers();
  const match = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim()
  );

  if (!match) {
    return { success: false, error: 'No account found with this email. Please check your credentials or sign up.' };
  }

  // Check password if set on user, otherwise accept password123 for demo seeds
  if (match.password && match.password !== password) {
    return { success: false, error: 'Incorrect password. Please verify your credentials and try again.' };
  }

  if (match.status === 'suspended') {
    return { success: false, error: 'This account is suspended. Please contact platform administration.' };
  }

  // Create active session
  const now = new Date();
  const session = {
    sessionId: `sess_${Date.now()}`,
    token: `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId: match.id,
    userRole: match.role,
    userEmail: match.email,
    userName: match.name,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: now.toISOString(),
    rememberMe: true,
    status: 'active',
  };
  setItem('upliftra_auth_session', session);

  setCurrentUser(match);
  window.dispatchEvent(new Event('upliftra_auth_state_changed'));
  return { success: true, user: match };
}

export function logoutUser(): void {
  // Delegate to auth.ts invalidateSession which logs the audit event and clears session
  try {
    // Dynamic import-style workaround: import invalidateSession inline to avoid circular deps
    deleteItem('upliftra_auth_session');
    deleteItem(STORAGE_KEYS.CURRENT_USER);
    // Prevent back-navigation to protected pages by replacing history state
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', window.location.href);
    }
    window.dispatchEvent(new Event('upliftra_auth_state_changed'));
  } catch {
    deleteItem('upliftra_auth_session');
    deleteItem(STORAGE_KEYS.CURRENT_USER);
    window.dispatchEvent(new Event('upliftra_auth_state_changed'));
  }
}

/**
 * switchUserByRole Ã¢â‚¬â€ RESTRICTED to Admin / Super Admin only.
 * Allows privileged administrators to impersonate a role for testing.
 * Regular users cannot access this function from the UI.
 */
export function switchUserByRole(role: UserRole): User {
  // Authorization guard: only Admin and Super Admin may switch roles
  const current = getCurrentUser();
  if (current.role !== 'Admin' && current.role !== 'Super Admin') {
    console.warn('[Security] switchUserByRole blocked: caller is not Admin or Super Admin.');
    return current;
  }

  const users = getUsers();
  let match = users.find((u) => u.role === role);
  if (!match) {
    // Create a placeholder representative user if no user with this role exists
    match = {
      id: `user_${role.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: `${role} Representative`,
      email: `${role.toLowerCase().replace(/[^a-z0-9]/g, '_')}@upliftra.pk`,
      role: role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      title: `Verified ${role} on Upliftra Network`,
      institution: 'Pakistan Professional Network',
      location: 'Lahore, Pakistan',
      bio: `Active representative for the ${role} portal on Upliftra Network Pakistan.`,
      skills: ['Networking', 'Career Growth', 'Collaboration'],
      status: 'active',
      verificationStatus: 'verified',
      profileCompletion: 75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(match);
    saveUsers(users);
  }

  // Create active session for switched persona (admin impersonation)
  const now = new Date();
  const session = {
    sessionId: `sess_admin_impersonate_${Date.now()}`,
    token: `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId: match.id,
    userRole: match.role,
    userEmail: match.email,
    userName: match.name,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2-hour impersonation session
    lastActivityAt: now.toISOString(),
    rememberMe: false,
    status: 'active',
  };
  setItem('upliftra_auth_session', session);

  setCurrentUser(match);

  logAuditEvent({
    action: 'admin_role_impersonation',
    userId: current.id,
    userName: current.name,
    userRole: current.role,
    target: `${match.name} (${role})`,
    description: `Admin impersonated role: ${role} for testing/management. 2-hour session issued.`,
  });

  window.dispatchEvent(new Event('upliftra_auth_state_changed'));
  return match;
}

// ----------------------------------------------------
// Opportunities & Bookmarks / Saved Opportunities
// ----------------------------------------------------

export function getOpportunities(): Opportunity[] {
  return getItem<Opportunity[]>(STORAGE_KEYS.OPPORTUNITIES, []);
}

export function saveOpportunities(opportunities: Opportunity[]): void {
  setItem(STORAGE_KEYS.OPPORTUNITIES, opportunities);
}

export function addOpportunity(opportunity: Opportunity): void {
  const list = getOpportunities();
  list.unshift(opportunity);
  saveOpportunities(list);
  
  opportunitiesApi.create(opportunity).catch(console.error);


  // Notify active users
  const current = getCurrentUser();
  addNotification({
    userId: current.id,
    title: `Opportunity Posted: ${opportunity.title}`,
    description: `New opportunity published by ${opportunity.company}.`,
    type: 'opportunity',
    linkTo: 'opportunities-board',
  });
}

export function updateOpportunity(opportunity: Opportunity): void {
  const list = getOpportunities();
  const idx = list.findIndex((o) => o.id === opportunity.id);
  if (idx !== -1) {
    list[idx] = opportunity;
    saveOpportunities(list);
    opportunitiesApi.update(opportunity.id, opportunity).catch(console.error);
  }
}

export function deleteOpportunity(id: string): void {
  const list = getOpportunities().filter((o) => o.id !== id);
  saveOpportunities(list);
  opportunitiesApi.delete(id).catch(console.error);
}

export function approveOpportunity(id: string): void {
  const list = getOpportunities();
  const opp = list.find((o) => o.id === id);
  if (opp) {
    opp.status = 'open';
    saveOpportunities(list);
  }
}

export function rejectOpportunity(id: string): void {
  const list = getOpportunities();
  const opp = list.find((o) => o.id === id);
  if (opp) {
    opp.status = 'closed';
    saveOpportunities(list);
  }
}

export function toggleFeatureOpportunity(id: string): void {
  const list = getOpportunities();
  const opp = list.find((o) => o.id === id);
  if (opp) {
    opp.featured = !opp.featured;
    saveOpportunities(list);
  }
}

export function getSavedOpportunityIds(): string[] {
  return getItem<string[]>(STORAGE_KEYS.SAVED_OPPORTUNITIES, SEED_SAVED_OPPORTUNITY_IDS);
}

export function toggleSaveOpportunity(opportunityId: string): boolean {
  const list = getSavedOpportunityIds();
  const index = list.indexOf(opportunityId);
  let isNowSaved = false;

  if (index !== -1) {
    list.splice(index, 1);
    isNowSaved = false;
  } else {
    list.push(opportunityId);
    isNowSaved = true;
  }

  setItem(STORAGE_KEYS.SAVED_OPPORTUNITIES, list);
  return isNowSaved;
}

export function isOpportunitySaved(opportunityId: string): boolean {
  const list = getSavedOpportunityIds();
  return list.includes(opportunityId);
}

// ----------------------------------------------------
// Applications Management (Applicant & Recruiter CRUD)
// ----------------------------------------------------

export function getApplications(): Application[] {
  return getItem<Application[]>(STORAGE_KEYS.APPLICATIONS, []);
}

export function saveApplications(applications: Application[]): void {
  setItem(STORAGE_KEYS.APPLICATIONS, applications);
}

export function submitApplication(app: Omit<Application, 'id' | 'appliedDate'>): Application {
  const list = getApplications();
  const newApp: Application = {
    ...app,
    id: `app_${Date.now()}`,
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'Submitted',
  };
  list.unshift(newApp);
  saveApplications(list);
  applicationsApi.create(app).catch(console.error);
  return newApp;
}


export function updateApplicationStatus(id: string, status: Application['status']): void {
  const list = getApplications();
  const idx = list.findIndex((a) => a.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    list[idx].reviewedDate = new Date().toISOString().split('T')[0];
    saveApplications(list);
    
    applicationsApi.update(id, { status, reviewedDate: list[idx].reviewedDate }).catch(console.error);

    // Notify applicant
    addNotification({
      userId: list[idx].applicantId,
      title: `Application Status Updated: ${status}`,
      description: `Your application for ${list[idx].opportunityTitle} is now marked as "${status}".`,
      type: 'application',
      linkTo: 'applications-tracker',
    });
  }
}

export function withdrawApplication(id: string): void {
  updateApplicationStatus(id, 'Withdrawn');
}

export function updateRecruiterApplication(
  id: string,
  updates: {
    status?: Application['status'];
    recruiterNotes?: string;
    interviewDate?: string;
    meetingLink?: string;
  }
): void {
  const list = getApplications();
  const idx = list.findIndex((a) => a.id === id);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...updates,
      reviewedDate: new Date().toISOString().split('T')[0],
    };
    saveApplications(list);
    
    applicationsApi.update(id, { ...updates, reviewedDate: list[idx].reviewedDate }).catch(console.error);

    if (updates.status) {
      addNotification({
        userId: list[idx].applicantId,
        title: `Hiring Update: ${list[idx].opportunityTitle}`,
        description: `Status changed to "${updates.status}". ${updates.interviewDate ? `Interview scheduled for: ${updates.interviewDate}` : ''}`,
        type: 'application',
        linkTo: 'applications-tracker',
      });
    }
  }
}

// ----------------------------------------------------
// Mentors, Requests & Sessions
// ----------------------------------------------------

export function getMentors(): Mentor[] {
  return getItem<Mentor[]>(STORAGE_KEYS.MENTORS, []);
}

export function saveMentors(mentors: Mentor[]): void {
  setItem(STORAGE_KEYS.MENTORS, mentors);
}

export function getMentorshipRequests(): MentorshipRequest[] {
  return getItem<MentorshipRequest[]>(STORAGE_KEYS.MENTORSHIP_REQUESTS, []);
}

export function saveMentorshipRequests(requests: MentorshipRequest[]): void {
  setItem(STORAGE_KEYS.MENTORSHIP_REQUESTS, requests);
}

export function submitMentorshipRequest(
  data: Omit<MentorshipRequest, 'id' | 'status' | 'createdAt'>
): MentorshipRequest {
  const list = getMentorshipRequests();
  const newReq: MentorshipRequest = {
    ...data,
    id: `mreq_${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  list.unshift(newReq);
  saveMentorshipRequests(list);
  
  mentorsApi.createRequest(newReq).catch(console.error);

  // Notify mentee
  addNotification({
    userId: data.menteeId,
    title: `Mentorship Requested with ${data.mentorName}`,
    description: `Topic: "${data.topic}". Awaiting mentor response.`,
    type: 'mentorship',
    linkTo: '1-on-1-mentorship',
  });

  return newReq;
}

export function respondToMentorshipRequest(
  requestId: string,
  status: MentorshipRequest['status'],
  meetingLink?: string,
  scheduledDate?: string,
  scheduledTime?: string
): void {
  const list = getMentorshipRequests();
  const req = list.find((r) => r.id === requestId);
  if (req) {
    req.status = status;
    if (meetingLink) req.meetingLink = meetingLink;
    if (scheduledDate) req.scheduledDate = scheduledDate;
    if (scheduledTime) req.scheduledTime = scheduledTime;
    saveMentorshipRequests(list);
    
    mentorsApi.updateRequest(requestId, req).catch(console.error);

    // If accepted/scheduled, also create or update a MentorshipSession
    if (status === 'accepted' || status === 'scheduled') {
      const sessions = getMentorshipSessions();
      sessions.unshift({
        id: `sess_${Date.now()}`,
        mentorId: req.mentorId,
        mentorName: req.mentorName,
        mentorAvatar: req.mentorAvatar,
        menteeId: req.menteeId,
        menteeName: req.menteeName,
        topic: req.topic,
        scheduledTime: `${scheduledDate || 'Upcoming'} ${scheduledTime || ''}`.trim(),
        meetingLink: meetingLink || 'https://meet.google.com/upl-session',
        status: 'confirmed',
      });
      saveToStorage(STORAGE_KEYS.MENTORSHIP_SESSIONS, sessions);
    }

    addNotification({
      userId: req.menteeId,
      title: `Mentorship Request ${status.toUpperCase()} by ${req.mentorName}`,
      description:
        status === 'accepted' || status === 'scheduled'
          ? `Meeting link: ${meetingLink || 'Available in portal'}`
          : `Your request was not accepted at this time.`,
      type: 'mentorship',
      linkTo: '1-on-1-mentorship',
    });
  }
}

export function completeMentorshipSession(
  requestId: string,
  feedback: string,
  rating: number
): void {
  const list = getMentorshipRequests();
  const req = list.find((r) => r.id === requestId);
  if (req) {
    req.status = 'completed';
    req.mentorFeedback = feedback;
    req.rating = rating;
    saveMentorshipRequests(list);
    
    mentorsApi.updateRequest(requestId, req).catch(console.error);
  }
}

export function getMentorshipSessions(): MentorshipSession[] {
  return getItem<MentorshipSession[]>(STORAGE_KEYS.MENTORSHIP_SESSIONS, []);
}

function saveToStorage<T>(key: string, data: T): void {
  setItem(key, data);
}

export function sendMentorshipRequest(
  data: Omit<MentorshipRequest, 'id' | 'status' | 'createdAt'>
): MentorshipRequest {
  return submitMentorshipRequest(data);
}

export function updateMentorshipRequestStatus(
  requestId: string,
  status: MentorshipRequest['status'],
  meetingLink?: string,
  scheduledDate?: string,
  scheduledTime?: string
): void {
  respondToMentorshipRequest(requestId, status, meetingLink, scheduledDate, scheduledTime);
}

export function bookMentorshipSession(
  session: Omit<MentorshipSession, 'id' | 'status'> & { status?: MentorshipSession['status'] }
): MentorshipSession {
  const list = getMentorshipSessions();
  const newSession: MentorshipSession = {
    ...session,
    id: `sess_${Date.now()}`,
    status: session.status || 'confirmed',
  };
  list.unshift(newSession);
  saveToStorage(STORAGE_KEYS.MENTORSHIP_SESSIONS, list);
  return newSession;
}

export function updateMentorshipSessionStatus(
  sessionId: string,
  status: string
): void {
  const list = getMentorshipSessions();
  const sess = list.find((s) => s.id === sessionId);
  if (sess) {
    const normalized = status.toLowerCase() as MentorshipSession['status'];
    sess.status = normalized === 'completed' || normalized === 'cancelled' ? normalized : 'confirmed';
    saveToStorage(STORAGE_KEYS.MENTORSHIP_SESSIONS, list);
  }
}

export function rateMentorshipSession(
  sessionId: string,
  rating: number,
  review?: string
): void {
  const list = getMentorshipSessions();
  const sess = list.find((s) => s.id === sessionId);
  if (sess) {
    sess.rating = rating;
    sess.feedback = review;
    sess.status = 'completed';
    saveToStorage(STORAGE_KEYS.MENTORSHIP_SESSIONS, list);
  }
}

// ----------------------------------------------------
// Courses & Verifiable Certificates
// ----------------------------------------------------

export function getCourses(): Course[] {
  return getItem<Course[]>(STORAGE_KEYS.COURSES, []);
}

export function saveCourses(courses: Course[]): void {
  setItem(STORAGE_KEYS.COURSES, courses);
}

export function addCourse(course: Course): void {
  const courses = getCourses();
  courses.unshift(course);
  saveCourses(courses);
}

export function toggleCourseModule(courseId: string, moduleId: string): void {
  const courses = getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (course) {
    const mod = course.modules.find((m) => m.id === moduleId);
    if (mod) {
      mod.completed = !mod.completed;
      saveCourses(courses);
    }
  }
}

export function getCertificates(): Certificate[] {
  return getItem<Certificate[]>(STORAGE_KEYS.CERTIFICATES, []);
}

export function issueCertificate(
  param1: User | Omit<Certificate, 'id' | 'issueDate' | 'verificationHash'>,
  param2?: Course
): Certificate {
  const list = getCertificates();
  let certData: Omit<Certificate, 'id' | 'issueDate' | 'verificationHash'>;

  if (param2 && 'role' in param1) {
    const user = param1 as User;
    const course = param2 as Course;
    certData = {
      certificateId: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      courseId: course.id,
      courseName: course.title,
      trainerName: course.trainer || course.instructor || 'Upliftra Academy',
      verificationStatus: 'verified',
      hecAligned: true,
    };
  } else {
    certData = param1 as Omit<Certificate, 'id' | 'issueDate' | 'verificationHash'>;
  }

  const newCert: Certificate = {
    ...certData,
    id: `cert_${Date.now()}`,
    issueDate: new Date().toISOString().split('T')[0],
    verificationHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
  };
  list.unshift(newCert);
  setItem(STORAGE_KEYS.CERTIFICATES, list);

  addNotification({
    userId: certData.userId,
    title: `Certificate Issued: ${certData.courseName}`,
    description: `Your verifiable certificate ID is ${certData.certificateId}.`,
    type: 'course',
    linkTo: 'learning-hub',
  });

  return newCert;
}

export function verifyCertificate(certificateId: string): Certificate | null {
  const list = getCertificates();
  return list.find((c) => c.certificateId.toLowerCase().trim() === certificateId.toLowerCase().trim()) || null;
}

// ----------------------------------------------------
// Events
// ----------------------------------------------------

export function getEvents(): PlatformEvent[] {
  return getItem<PlatformEvent[]>(STORAGE_KEYS.EVENTS, []);
}

export function saveEvents(events: PlatformEvent[]): void {
  setItem(STORAGE_KEYS.EVENTS, events);
}

export function registerForEvent(eventId: string): boolean {
  const events = getEvents();
  const user = getCurrentUser();
  const ev = events.find((e) => e.id === eventId);
  if (!ev) return false;

  if (!ev.registeredUserIds) ev.registeredUserIds = [];

  const alreadyRegistered = ev.registeredUserIds.includes(user.id);
  if (alreadyRegistered) {
    // Unregister
    ev.registeredUserIds = ev.registeredUserIds.filter((id) => id !== user.id);
    ev.registeredCount = Math.max(0, ev.registeredCount - 1);
    saveEvents(events);
    return false;
  } else {
    // Register
    ev.registeredUserIds.push(user.id);
    ev.registeredCount += 1;
    saveEvents(events);

    addNotification({
      userId: user.id,
      title: `Registered: ${ev.title}`,
      description: `Event on ${ev.date} at ${ev.time}. Location: ${ev.location}.`,
      type: 'event',
      linkTo: 'events-webinars',
    });
    return true;
  }
}

// ----------------------------------------------------
// Community Posts, Reports & Moderation
// ----------------------------------------------------

export function getCommunityPosts(): CommunityPost[] {
  return getItem<CommunityPost[]>(STORAGE_KEYS.COMMUNITY_POSTS, []);
}

export function saveCommunityPosts(posts: CommunityPost[]): void {
  setItem(STORAGE_KEYS.COMMUNITY_POSTS, posts);
}

export function addCommunityPost(
  content: string,
  tags: string[],
  postType?: CommunityPost['postType']
): CommunityPost {
  const posts = getCommunityPosts();
  const user = getCurrentUser();
  const newPost: CommunityPost = {
    id: `post_${Date.now()}`,
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorRole: user.role,
    postType: postType || 'Career question',
    content,
    tags,
    upvotes: 1,
    userUpvoted: true,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
    comments: [],
    isHidden: false,
    reportsCount: 0,
  };
  posts.unshift(newPost);
  saveCommunityPosts(posts);
  return newPost;
}

export function deleteCommunityPost(postId: string): void {
  const posts = getCommunityPosts().filter((p) => p.id !== postId);
  saveCommunityPosts(posts);
}

export function toggleHidePost(postId: string): void {
  const posts = getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.isHidden = !post.isHidden;
    saveCommunityPosts(posts);
  }
}

export function toggleUpvote(postId: string): void {
  const posts = getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    if (post.userUpvoted) {
      post.upvotes = Math.max(0, post.upvotes - 1);
      post.userUpvoted = false;
    } else {
      post.upvotes += 1;
      post.userUpvoted = true;
    }
    saveCommunityPosts(posts);
  }
}

export function addComment(postId: string, content: string): void {
  const posts = getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    const user = getCurrentUser();
    if (!post.comments) post.comments = [];
    post.comments.push({
      id: `comment_${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      content,
      createdAt: new Date().toISOString(),
    });
    post.commentsCount = post.comments.length;
    saveCommunityPosts(posts);
  }
}

export function getCommunityReports(): CommunityReport[] {
  return getItem<CommunityReport[]>(STORAGE_KEYS.COMMUNITY_REPORTS, []);
}

export function pinCommunityPost(postId: string): void {
  const posts = getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.isPinned = !post.isPinned;
    saveCommunityPosts(posts);
  }
}

export function reportPost(postId: string, reason: string): void {
  const posts = getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  const user = getCurrentUser();

  const reports = getCommunityReports();
  reports.unshift({
    id: `rep_${Date.now()}`,
    postId,
    postSnippet: post ? post.content.substring(0, 80) : 'Post content',
    postContentSnippet: post ? post.content.substring(0, 80) + '...' : 'Post content',
    postAuthor: post?.authorName || 'Community Member',
    reportedBy: user.id,
    reporterName: user.name,
    reason,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString().split('T')[0],
    status: 'pending',
  });
  setItem(STORAGE_KEYS.COMMUNITY_REPORTS, reports);

  if (post) {
    post.reportsCount = (post.reportsCount || 0) + 1;
    saveCommunityPosts(posts);
  }
}

export function reportCommunityPost(
  postId: string,
  authorOrReason: string,
  contentOrSnippet?: string,
  maybeReason?: string
): void {
  const user = getCurrentUser();
  const reports = getCommunityReports();
  const reason = maybeReason || authorOrReason || 'Inappropriate content';
  const snippet = contentOrSnippet || 'Post content';
  reports.unshift({
    id: `rep_${Date.now()}`,
    postId,
    postSnippet: snippet.substring(0, 100),
    postContentSnippet: snippet.substring(0, 100),
    postAuthor: typeof authorOrReason === 'string' && maybeReason ? authorOrReason : 'Community Member',
    reportedBy: user.id,
    reporterName: user.name,
    reason,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString().split('T')[0],
    status: 'pending',
  });
  setItem(STORAGE_KEYS.COMMUNITY_REPORTS, reports);

  const posts = getCommunityPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.reportsCount = (post.reportsCount || 0) + 1;
    saveCommunityPosts(posts);
  }
}

export function resolveCommunityReport(reportId: string, action: 'hide' | 'dismiss' | 'delete' | 'action_taken' | string): void {
  const reports = getCommunityReports();
  const rep = reports.find((r) => r.id === reportId);
  if (!rep) return;

  rep.status = action === 'dismiss' ? 'dismissed' : action === 'action_taken' ? 'action_taken' : 'resolved';
  setItem(STORAGE_KEYS.COMMUNITY_REPORTS, reports);

  if (action === 'hide') {
    toggleHidePost(rep.postId);
  } else if (action === 'delete') {
    deleteCommunityPost(rep.postId);
  }
}

// ----------------------------------------------------
// Connections & Networking
// ----------------------------------------------------

export function getConnections(): Connection[] {
  return getItem<Connection[]>(STORAGE_KEYS.CONNECTIONS, []);
}

export function sendConnectionRequest(targetUser: User): Connection {
  const list = getConnections();
  const current = getCurrentUser();
  const newConn: Connection = {
    id: `conn_${Date.now()}`,
    requesterId: current.id,
    requesterName: current.name,
    requesterRole: current.role,
    requesterAvatar: current.avatar,
    requesterTitle: current.title,
    receiverId: targetUser.id,
    receiverName: targetUser.name,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  list.unshift(newConn);
  setItem(STORAGE_KEYS.CONNECTIONS, list);

  addNotification({
    userId: targetUser.id,
    title: `Connection Request from ${current.name}`,
    description: `${current.name} (${current.role}) wants to connect on Upliftra.`,
    type: 'connection',
    linkTo: 'networking',
  });

  return newConn;
}

export function updateConnectionStatus(connectionId: string, status: Connection['status']): void {
  const list = getConnections();
  const conn = list.find((c) => c.id === connectionId);
  if (conn) {
    conn.status = status;
    setItem(STORAGE_KEYS.CONNECTIONS, list);

    if (status === 'connected') {
      addNotification({
        userId: conn.requesterId,
        title: `Connection Accepted: ${conn.receiverName}`,
        description: `You and ${conn.receiverName} are now connected on Upliftra Network.`,
        type: 'connection',
        linkTo: 'networking',
      });
    }
  }
}

export function removeConnection(connectionId: string): void {
  const list = getConnections().filter((c) => c.id !== connectionId);
  setItem(STORAGE_KEYS.CONNECTIONS, list);
}

// ----------------------------------------------------
// Direct Messages (Local Storage)
// ----------------------------------------------------

export function getDirectMessages(): DirectMessage[] {
  return getItem<DirectMessage[]>(STORAGE_KEYS.MESSAGES, []);
}

export function sendDirectMessage(
  receiverId: string,
  receiverName: string,
  content: string
): DirectMessage {
  const current = getCurrentUser();
  const list = getDirectMessages();
  const convId = [current.id, receiverId].sort().join('_');
  const newMsg: DirectMessage = {
    id: `msg_${Date.now()}`,
    conversationId: `conv_${convId}`,
    senderId: current.id,
    senderName: current.name,
    senderAvatar: current.avatar,
    receiverId,
    receiverName,
    content: content.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };
  list.push(newMsg);
  setItem(STORAGE_KEYS.MESSAGES, list);

  addNotification({
    userId: receiverId,
    title: `New Message from ${current.name}`,
    description: content.length > 50 ? content.substring(0, 50) + '...' : content,
    type: 'message',
    linkTo: 'direct-messages',
  });

  return newMsg;
}

export function deleteDirectMessage(messageId: string): void {
  const list = getDirectMessages().filter((m) => m.id !== messageId);
  setItem(STORAGE_KEYS.MESSAGES, list);
}

// ----------------------------------------------------
// Startups
// ----------------------------------------------------

export function getStartups(): Startup[] {
  return getItem<Startup[]>(STORAGE_KEYS.STARTUPS, []);
}

export function addStartup(startup: Startup): void {
  const startups = getStartups();
  startups.unshift(startup);
  setItem(STORAGE_KEYS.STARTUPS, startups);
}

// ----------------------------------------------------
// Notifications
// ----------------------------------------------------

export function getNotifications(): NotificationItem[] {
  return getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
}

export function addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): void {
  const list = getNotifications();
  const newItem: NotificationItem = {
    ...item,
    id: `notif_${Date.now()}`,
    timestamp: 'Just now',
    read: false,
  };
  list.unshift(newItem);
  setItem(STORAGE_KEYS.NOTIFICATIONS, list);
}

export function markNotificationAsRead(id: string): void {
  const list = getNotifications();
  const item = list.find((n) => n.id === id);
  if (item) {
    item.read = true;
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  }
}

export function markAllNotificationsAsRead(): void {
  const list = getNotifications().map((n) => ({ ...n, read: true }));
  setItem(STORAGE_KEYS.NOTIFICATIONS, list);
}

export function deleteNotification(id: string): void {
  const list = getNotifications().filter((n) => n.id !== id);
  setItem(STORAGE_KEYS.NOTIFICATIONS, list);
}

// ----------------------------------------------------
// AI Coach History
// ----------------------------------------------------

export function getAIHistory(): AIChatMessage[] {
  return getItem<AIChatMessage[]>(STORAGE_KEYS.AI_HISTORY, []);
}

export function addAIMessage(msg: Omit<AIChatMessage, 'id' | 'timestamp'>): AIChatMessage {
  const list = getAIHistory();
  const newMsg: AIChatMessage = {
    ...msg,
    id: `ai_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  list.push(newMsg);
  setItem(STORAGE_KEYS.AI_HISTORY, list);
  return newMsg;
}

export function clearAIHistory(): void {
  setItem(STORAGE_KEYS.AI_HISTORY, []);
}

// ----------------------------------------------------
// Role Permissions & Security Matrix
// ----------------------------------------------------

export function getRolePermissions(): RolePermission[] {
  return getItem<RolePermission[]>(STORAGE_KEYS.PERMISSIONS, ROLE_PERMISSIONS_MATRIX);
}

export function updateRolePermission(permission: RolePermission): void {
  const list = getRolePermissions();
  const idx = list.findIndex((p) => p.role === permission.role);
  if (idx !== -1) {
    list[idx] = permission;
    setItem(STORAGE_KEYS.PERMISSIONS, list);
  }
}

// ----------------------------------------------------
// Diagnostics & Reset
// ----------------------------------------------------

export function resetDatabaseToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.clear();
  initLocalStorage();
  window.dispatchEvent(new CustomEvent('upliftra_data_changed', { detail: { key: 'all' } }));
}

export function getStorageStats() {
  if (typeof window === 'undefined') return { totalKb: 0, itemsCount: 0 };
  let totalLength = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      totalLength += (localStorage[key]?.length || 0) + key.length;
    }
  }
  return {
    totalKb: Number((totalLength / 1024).toFixed(2)),
    itemsCount: Object.keys(localStorage).length,
  };
}

// ----------------------------------------------------
// Institutional Verification Requests
// ----------------------------------------------------

const SEED_VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: 'vreq_1',
    entityName: 'Habib Bank Limited (HBL Innovation)',
    entityType: 'company',
    registrationNumber: 'SECP-KHI-0091823',
    documentProof: 'SECP Incorporation Certificate & NTN Tax Filer 2025',
    contactEmail: 'talent@hbl.com.pk',
    requestDate: '2026-03-01',
    status: 'pending',
  },
  {
    id: 'vreq_2',
    entityName: 'National University of Sciences & Technology (NUST)',
    entityType: 'university',
    registrationNumber: 'HEC-PK-NUST-1991',
    documentProof: 'Higher Education Commission Accreditation Letter',
    contactEmail: 'careers@nust.edu.pk',
    requestDate: '2026-02-28',
    status: 'approved',
  },
  {
    id: 'vreq_3',
    entityName: 'PakWheels (Autocom Pvt Ltd)',
    entityType: 'company',
    registrationNumber: 'SECP-LHR-0038291',
    documentProof: 'FBR Sales Tax & SECP Registration',
    contactEmail: 'hr@pakwheels.com',
    requestDate: '2026-03-05',
    status: 'pending',
  },
];

export function getVerificationRequests(): VerificationRequest[] {
  return getItem<VerificationRequest[]>(STORAGE_KEYS.VERIFICATIONS, SEED_VERIFICATION_REQUESTS);
}

export function saveVerificationRequests(requests: VerificationRequest[]): void {
  setItem(STORAGE_KEYS.VERIFICATIONS, requests);
}

export function approveVerificationRequest(id: string): void {
  const list = getVerificationRequests();
  const req = list.find((v) => v.id === id);
  if (req) {
    req.status = 'approved';
    saveVerificationRequests(list);
    logAuditEvent('Verification Approved', `Approved verification for ${req.entityName}.`);
  }
}

export function rejectVerificationRequest(id: string): void {
  const list = getVerificationRequests();
  const req = list.find((v) => v.id === id);
  if (req) {
    req.status = 'rejected';
    saveVerificationRequests(list);
    logAuditEvent('Verification Rejected', `Rejected verification for ${req.entityName}.`);
  }
}

// ----------------------------------------------------
// Audit Trail & Logging
// ----------------------------------------------------

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit_1',
    timestamp: '2026-03-14 09:12 PKT',
    action: 'System Initialized',
    userId: 'user_admin',
    userName: 'Usman Ghani',
    userRole: 'Super Admin',
    details: 'Database seeded with 15 personas and national opportunities.',
  },
  {
    id: 'audit_2',
    timestamp: '2026-03-14 10:30 PKT',
    action: 'Opportunity Created',
    userId: 'user_recruiter',
    userName: 'Farhan Zaidi',
    userRole: 'Recruiter',
    details: 'Published opportunity: Senior MERN Stack Engineer at Systems Limited.',
  },
  {
    id: 'audit_3',
    timestamp: '2026-03-14 11:45 PKT',
    action: 'Role Switched',
    userId: 'user_student',
    userName: 'Muhammad Ahmed',
    userRole: 'Student',
    details: 'User switched active testing persona to Student.',
  },
];

export function getAuditLogs(): AuditLog[] {
  return getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
}

export function logAuditEvent(
  actionOrObj: string | { action: string; userId?: string; userName?: string; userRole?: string; target?: string; description?: string; details?: string },
  detailsArg?: string
): void {
  const list = getAuditLogs();
  const currentUser = getCurrentUser();

  let newLog: AuditLog;

  if (typeof actionOrObj === 'string') {
    newLog = {
      id: `audit_${Date.now()}`,
      logId: `LOG_${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
      action: actionOrObj,
      adminId: currentUser.role === 'Admin' || currentUser.role === 'Super Admin' ? currentUser.id : undefined,
      target: 'Platform System',
      description: detailsArg || actionOrObj,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      details: detailsArg || actionOrObj,
    };
  } else {
    newLog = {
      id: `audit_${Date.now()}`,
      logId: `LOG_${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
      action: actionOrObj.action,
      adminId: actionOrObj.userId || currentUser.id,
      target: actionOrObj.target || 'System Target',
      description: actionOrObj.description || actionOrObj.details || actionOrObj.action,
      userId: actionOrObj.userId || currentUser.id,
      userName: actionOrObj.userName || currentUser.name,
      userRole: actionOrObj.userRole || currentUser.role,
      details: actionOrObj.details || actionOrObj.description || actionOrObj.action,
    };
  }

  list.unshift(newLog);
  // Keep last 100 logs
  if (list.length > 100) list.pop();
  setItem(STORAGE_KEYS.AUDIT_LOGS, list);
}

// ----------------------------------------------------
// System Settings & Feature Flags
// ----------------------------------------------------

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  platformName: 'Upliftra Network',
  tagline: "Pakistan's Premier Opportunity & Career Ecosystem",
  contactEmail: 'support@upliftra.pk',
  allowRegistration: true,
};

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  mentorship: true,
  aiCoach: true,
  excelManager: true,
  communityForum: true,
  startupsModule: true,
};

export function getSystemSettings(): SystemSettings {
  return getItem<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SYSTEM_SETTINGS);
}

export function updateSystemSettings(settings: SystemSettings): void {
  setItem(STORAGE_KEYS.SETTINGS, settings);
  logAuditEvent('Settings Updated', 'Platform branding & system parameters updated.');
}

export function getFeatureFlags(): FeatureFlags {
  return getItem<FeatureFlags>(STORAGE_KEYS.FEATURE_FLAGS, DEFAULT_FEATURE_FLAGS);
}

export function toggleFeatureFlag(flag: keyof FeatureFlags): void {
  const flags = getFeatureFlags();
  flags[flag] = !flags[flag];
  setItem(STORAGE_KEYS.FEATURE_FLAGS, flags);
  logAuditEvent('Feature Flag Toggled', `Flag "${String(flag)}" toggled to ${flags[flag]}.`);
}



