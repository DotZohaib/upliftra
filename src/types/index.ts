export type UserRole =
  | 'Student'
  | 'Professional'
  | 'Mentor'
  | 'Recruiter'
  | 'Company'
  | 'Startup/Founder'
  | 'University'
  | 'Organization'
  | 'Volunteer'
  | 'Campus Ambassador'
  | 'Partner'
  | 'Moderator'
  | 'Trainer'
  | 'Admin'
  | 'Super Admin';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface SkillItem {
  id: string;
  name: string;
  level: SkillLevel;
}

export interface EducationRecord {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  grade?: string;
  description?: string;
}

export interface ExperienceRecord {
  id: string;
  company: string;
  position: string;
  employmentType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Remote';
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional - never sent to client in production
  role: UserRole;
  avatar: string;
  title: string;
  institution?: string;
  location: string;
  city?: string;
  country?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bio: string;
  skills: string[];
  skillItems?: SkillItem[];
  education?: string;
  educationList?: EducationRecord[];
  experience?: string;
  experienceList?: ExperienceRecord[];
  interests?: string[];
  careerGoals?: string;
  desiredJob?: string;
  preferredIndustry?: string;
  preferredLocation?: string;
  remotePreference?: boolean;
  experienceLevel?: 'Entry-level' | 'Mid-level' | 'Senior' | 'Lead' | 'Executive';
  industry?: string;
  portfolio?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  accountType?: 'individual' | 'organization';
  status: 'active' | 'inactive' | 'pending' | 'pending_verification' | 'suspended' | 'disabled' | 'deleted';
  verificationStatus: 'verified' | 'unverified' | 'in-review';
  emailVerified?: boolean;
  profileCompletion?: number;
  privacySettings?: PrivacySettings;
  createdAt: string;
  updatedAt: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'network' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showActivityStatus: boolean;
  allowDirectMessages: 'everyone' | 'verified_only' | 'connections_only';
  searchEngineIndexing: boolean;
}

export interface AuthSession {
  sessionId: string;
  token: string;
  userId: string;
  userRole: UserRole;
  userEmail: string;
  userName: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  rememberMe: boolean;
  ipAddress?: string;
  userAgent?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface UserCredential {
  userId: string;
  email: string;
  passwordHash: string;
  salt: string;
  iterations: number;
  createdAt: string;
  updatedAt: string;
}

export interface BruteForceLock {
  identifier: string; // email or IP
  failedAttempts: number;
  lockedUntil: string | null;
  lastAttemptAt: string;
}

export interface PasswordResetToken {
  token: string;
  code: string; // 6-digit verification code
  email: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface EmailVerificationToken {
  userId: string;
  email: string;
  code: string; // 6-digit code
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export type OpportunityType =
  | 'Job'
  | 'Internship'
  | 'Scholarship'
  | 'Fellowship'
  | 'Competition'
  | 'Training'
  | 'Certification'
  | 'Volunteer';

export interface Opportunity {
  id: string;
  title: string;
  type: OpportunityType;
  company: string;
  logo: string;
  description: string;
  location: string;
  remote: boolean;
  workplaceType?: 'Onsite' | 'Remote' | 'Hybrid';
  salary?: string;
  deadline: string;
  category: string;
  officialSource: string;
  applicationLink: string;
  verificationStatus: 'verified' | 'unverified';
  partnerType?: string;
  aiMatchScore?: number;
  tags: string[];
  requirements: string[];
  experienceLevel?: 'Entry-level' | 'Mid-level' | 'Senior' | 'Lead' | 'Executive';
  educationRequired?: string;
  benefits?: string[];
  postedDate?: string;
  recruiterId?: string;
  status?: 'active' | 'open' | 'closed' | 'archived' | 'draft';
  featured?: boolean;
  createdAt: string;
}

export type ApplicationStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Offered'
  | 'Offer Received'
  | 'Rejected'
  | 'Withdrawn';

export interface Application {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  company: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantAvatar?: string;
  status: ApplicationStatus;
  appliedDate: string;
  cvName: string;
  cvUrl?: string;
  coverLetter?: string;
  interviewDate?: string;
  meetingLink?: string;
  notes?: string;
  recruiterNotes?: string;
  reviewedDate?: string;
}

export interface Mentor {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  roleTitle: string;
  company: string;
  almaMater: string;
  expertise: string[];
  experience: string;
  availability: string;
  rating: number;
  totalSessions: number;
  bio: string;
  isProBono: boolean;
  hourlyRate?: string;
  status: 'active' | 'busy' | 'offline';
}

export interface MentorshipRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  menteeId: string;
  menteeName: string;
  menteeEmail?: string;
  menteeAvatar: string;
  topic: string;
  goals: string;
  preferredTime?: string;
  preferredDate?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed';
  meetingLink?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  mentorFeedback?: string;
  rating?: number;
  createdAt: string;
}

export interface MentorshipSession {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  menteeId: string;
  menteeName: string;
  topic: string;
  scheduledTime: string;
  meetingLink: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  rating?: number;
  feedback?: string;
  review?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
  lessons?: {
    id: string;
    title: string;
    duration: string;
    completed: boolean;
    videoUrl?: string;
    summary?: string;
  }[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  trainer?: string;
  trainerRole?: string;
  trainerId?: string;
  instructor?: string;
  instructorAvatar?: string;
  category: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  modulesCount?: number;
  enrolledCount: number;
  rating: number;
  thumbnail?: string;
  modules: CourseModule[];
  status?: 'published' | 'draft';
  certificateEligible?: boolean;
}

export interface Certificate {
  id: string;
  certificateId: string;
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  trainerName: string;
  issueDate: string;
  verificationStatus: 'verified' | 'unverified';
  verificationHash: string;
  hecAligned: boolean;
}

export interface PlatformEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  speaker: string;
  speakerRole: string;
  location: string;
  isOnline: boolean;
  registrationLink?: string;
  registeredCount: number;
  registeredUserIds?: string[];
  prizePool?: string;
  status: 'upcoming' | 'ongoing' | 'ended';
  banner: string;
}

export type CommunityPostType =
  | 'Career question'
  | 'Job discussion'
  | 'Learning'
  | 'Networking'
  | 'Startup'
  | 'General discussion';

export interface CommunityComment {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  postType?: CommunityPostType;
  content: string;
  tags: string[];
  upvotes: number;
  userUpvoted?: boolean;
  commentsCount: number;
  createdAt: string;
  comments?: CommunityComment[];
  isHidden?: boolean;
  isPinned?: boolean;
  reportsCount?: number;
}

export interface CommunityReport {
  id: string;
  postId: string;
  postContentSnippet: string;
  postSnippet?: string;
  postAuthor?: string;
  reportedBy: string;
  reporterName: string;
  reason: string;
  timestamp: string;
  createdAt?: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'action_taken';
}

export interface Connection {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  requesterAvatar: string;
  requesterTitle: string;
  receiverId: string;
  receiverName: string;
  status: 'pending' | 'connected' | 'rejected';
  createdAt: string;
}

export interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  industry: string;
  city: string;
  stage: string;
  founderName?: string;
  founderId?: string;
  founders?: {
    name: string;
    role: string;
    avatar: string;
  }[];
  lookingFor?: string[];
  openRoles: string[];
  seekingCoFounder?: boolean;
  logo: string;
  website: string;
  fundingStatus?: string;
  teamSize?: string;
  createdAt?: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'opportunity' | 'application' | 'mentorship' | 'message' | 'system' | 'connection' | 'event' | 'course';
  timestamp: string;
  read: boolean;
  linkTo?: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export interface RolePermission {
  role: UserRole;
  viewOpportunities: boolean;
  applyOpportunities: boolean;
  postOpportunities: boolean;
  requestMentorship: boolean;
  offerMentorship: boolean;
  createCourses: boolean;
  moderateCommunity: boolean;
  managePlatformData: boolean;
  accessSuperAdmin: boolean;
  description: string;
}

export interface VerificationRequest {
  id: string;
  entityName: string;
  entityType: 'company' | 'university' | 'organization';
  registrationNumber: string;
  documentProof: string;
  contactEmail: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuditLog {
  id: string;
  logId?: string;
  timestamp: string;
  action: string;
  adminId?: string;
  target?: string;
  description?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  details?: string;
}

export interface SystemSettings {
  platformName: string;
  tagline: string;
  contactEmail: string;
  allowRegistration: boolean;
}

export interface FeatureFlags {
  mentorship: boolean;
  aiCoach: boolean;
  excelManager: boolean;
  communityForum: boolean;
  startupsModule: boolean;
}

