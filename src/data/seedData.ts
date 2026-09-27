import {
  User,
  Opportunity,
  Mentor,
  Course,
  PlatformEvent,
  CommunityPost,
  Startup,
  RolePermission,
  Application,
  MentorshipSession,
  NotificationItem,
  MentorshipRequest,
  Connection,
  Certificate,
  CommunityReport,
} from '../types';

export const SEED_USERS: User[] = [];

export const SEED_OPPORTUNITIES: Opportunity[] = [];

export const SEED_MENTORS: Mentor[] = [];

export const SEED_COURSES: Course[] = [];

export const SEED_EVENTS: PlatformEvent[] = [];

export const SEED_COMMUNITY_POSTS: CommunityPost[] = [];

export const SEED_STARTUPS: Startup[] = [];

export const SEED_APPLICATIONS: Application[] = [];

export const SEED_SESSIONS: MentorshipSession[] = [];

export const SEED_NOTIFICATIONS: NotificationItem[] = [];

export const ROLE_PERMISSIONS_MATRIX: RolePermission[] = [
  {
    role: 'Student',
    viewOpportunities: true,
    applyOpportunities: true,
    postOpportunities: false,
    requestMentorship: true,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Access career discovery, apply to jobs & internships, request mentors, enroll in courses.',
  },
  {
    role: 'Professional',
    viewOpportunities: true,
    applyOpportunities: true,
    postOpportunities: false,
    requestMentorship: true,
    offerMentorship: true,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Search senior positions, network, share industry advice, engage in peer mentorship.',
  },
  {
    role: 'Mentor',
    viewOpportunities: true,
    applyOpportunities: false,
    postOpportunities: false,
    requestMentorship: false,
    offerMentorship: true,
    createCourses: true,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Manage 1-on-1 guidance sessions, accept mentees, conduct mock technical interviews.',
  },
  {
    role: 'Recruiter',
    viewOpportunities: true,
    applyOpportunities: false,
    postOpportunities: true,
    requestMentorship: false,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Post verified vacancies, review applicant dossiers, schedule interviews, manage candidate pipeline.',
  },
  {
    role: 'Company',
    viewOpportunities: true,
    applyOpportunities: false,
    postOpportunities: true,
    requestMentorship: false,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Manage corporate brand profile, internship pipelines, talent analytics, and job postings.',
  },
  {
    role: 'Startup/Founder',
    viewOpportunities: true,
    applyOpportunities: false,
    postOpportunities: true,
    requestMentorship: true,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'List startup profile, seek co-founders, post equity/stipend roles, connect with incubators.',
  },
  {
    role: 'University',
    viewOpportunities: true,
    applyOpportunities: false,
    postOpportunities: true,
    requestMentorship: false,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Verify student cohorts, organize campus placement drives, track graduate placement metrics.',
  },
  {
    role: 'Organization',
    viewOpportunities: true,
    applyOpportunities: false,
    postOpportunities: true,
    requestMentorship: false,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Publish national fellowship initiatives, research grants, and social enterprise campaigns.',
  },
  {
    role: 'Volunteer',
    viewOpportunities: true,
    applyOpportunities: true,
    postOpportunities: false,
    requestMentorship: true,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Apply to community service events, log volunteer hours, earn digital certificates.',
  },
  {
    role: 'Campus Ambassador',
    viewOpportunities: true,
    applyOpportunities: true,
    postOpportunities: false,
    requestMentorship: true,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Lead campus promotional drives, hackathon registrations, and earn ambassador points.',
  },
  {
    role: 'Partner',
    viewOpportunities: true,
    applyOpportunities: false,
    postOpportunities: true,
    requestMentorship: false,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Co-sponsor scholarship programs, diplomatic exchanges (USEFP, DAAD), and summits.',
  },
  {
    role: 'Moderator',
    viewOpportunities: true,
    applyOpportunities: false,
    postOpportunities: false,
    requestMentorship: false,
    offerMentorship: false,
    createCourses: false,
    moderateCommunity: true,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Review reported content, ensure zero spam/fraud listings, enforce community guidelines.',
  },
  {
    role: 'Trainer',
    viewOpportunities: true,
    applyOpportunities: false,
    postOpportunities: false,
    requestMentorship: false,
    offerMentorship: true,
    createCourses: true,
    moderateCommunity: false,
    managePlatformData: false,
    accessSuperAdmin: false,
    description: 'Publish bootcamps and technical masterclasses, manage module lessons and attendee certificates.',
  },
  {
    role: 'Admin',
    viewOpportunities: true,
    applyOpportunities: true,
    postOpportunities: true,
    requestMentorship: true,
    offerMentorship: true,
    createCourses: true,
    moderateCommunity: true,
    managePlatformData: true,
    accessSuperAdmin: false,
    description: 'Manage verified opportunities, users, Excel imports/exports, and system analytics.',
  },
  {
    role: 'Super Admin',
    viewOpportunities: true,
    applyOpportunities: true,
    postOpportunities: true,
    requestMentorship: true,
    offerMentorship: true,
    createCourses: true,
    moderateCommunity: true,
    managePlatformData: true,
    accessSuperAdmin: true,
    description: 'Full unconstrained platform control, RBAC security configurations, and local DB backup/wipe.',
  },
];

export const SEED_SAVED_OPPORTUNITY_IDS: string[] = [];

export const SEED_MENTORSHIP_REQUESTS: MentorshipRequest[] = [];

export const SEED_CONNECTIONS: Connection[] = [];

export const SEED_CERTIFICATES: Certificate[] = [];

export const SEED_COMMUNITY_REPORTS: CommunityReport[] = [];

