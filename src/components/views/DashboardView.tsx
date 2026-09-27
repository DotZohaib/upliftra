import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Download,
  Search,
  Send,
  GraduationCap,
  Volume2,
  Check,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Video,
  FileSpreadsheet,
  Lightbulb,
  Bookmark,
  Share2,
  Filter,
  Handshake,
  Users,
  BookOpen,
  MessageSquare,
  Rocket,
  UserCheck,
  ShieldAlert,
  Briefcase,
  ShieldCheck,
  BarChart3,
  Award,
} from 'lucide-react';
import { isAdmin, isSuperAdmin, isMentor, isRecruiterOrCompany } from '../../lib/permissions';
import {
  User,
  Opportunity,
  Application,
  Mentor,
  MentorshipSession,
  PlatformEvent,
} from '../../types';
import {
  getCurrentUser,
  getOpportunities,
  getApplications,
  getMentorshipSessions,
  getEvents,
  submitApplication,
  addNotification,
  getUsers,
  getAuditLogs,
  calculateProfileCompletion,
} from '../../lib/storage';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  onNavigate: (path: string) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectOpportunity,
}) => {
  // Performance: Load from localStorage once, refresh only when data changes
  const [currentUser, setCurrentUser] = useState<User>(() => getCurrentUser());
  const [opportunities, setOpportunities] = useState(() => getOpportunities());
  const [applications, setApplications] = useState(() => getApplications());
  const [sessions, setSessions] = useState(() => getMentorshipSessions());
  const [events, setEvents] = useState(() => getEvents());
  const [allUsers, setAllUsers] = useState(() => getUsers());
  const [auditLogs, setAuditLogs] = useState(() => getAuditLogs());

  const profileComp = useMemo(() => calculateProfileCompletion(currentUser), [currentUser]);

  // Subscribe to data changes — refresh only when LocalStorage is mutated
  useEffect(() => {
    const refresh = () => {
      setCurrentUser(getCurrentUser());
      setOpportunities(getOpportunities());
      setApplications(getApplications());
      setSessions(getMentorshipSessions());
      setEvents(getEvents());
      setAllUsers(getUsers());
      setAuditLogs(getAuditLogs());
    };
    window.addEventListener('upliftra_data_changed', refresh);
    return () => window.removeEventListener('upliftra_data_changed', refresh);
  }, []);

  // State
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('Recommended for You');
  const [selectedRegion, setSelectedRegion] = useState('All Pakistan');
  const [isAtsScanning, setIsAtsScanning] = useState(false);
  const [atsScore, setAtsScore] = useState(88);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState('');

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['opp_1']);
  const [appliedSuccessId, setAppliedSuccessId] = useState<string | null>(null);

  // Filtered opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedCategoryTab === 'High-Stipend Internships') {
      return opp.type === 'Internship';
    }
    if (selectedCategoryTab === 'Global Scholarships') {
      return opp.type === 'Scholarship' || opp.type === 'Fellowship';
    }
    if (selectedCategoryTab === 'Fresh Grad Trainee') {
      return opp.type === 'Job' || opp.tags.some((t) => t.includes('Grad') || t.includes('Trainee'));
    }
    return true;
  });

  const handleRunAtsScan = () => {
    setIsAtsScanning(true);
    setTimeout(() => {
      setAtsScore(92);
      setIsAtsScanning(false);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.2 } });
      } catch (e) {
        // Safe fallback
      }
    }, 1200);
  };

  const handleAiSend = () => {
    if (!aiChatInput.trim()) return;
    setAiFeedbackMessage(`Processing prompt locally: "${aiChatInput.slice(0, 32)}..."`);
    setTimeout(() => {
      setAiFeedbackMessage('Recommendation updated! CV matched with Systems Ltd & Arbisoft specs.');
      setAiChatInput('');
    }, 1200);
  };

  const handleQuickPrompt = (prompt: string) => {
    setAiChatInput(prompt);
  };



  const handleBookmarkToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter((item) => item !== id));
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
    }
  };

  const handleOneClickApply = (opp: Opportunity, e: React.MouseEvent) => {
    e.stopPropagation();
    submitApplication({
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      company: opp.company,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantEmail: currentUser.email,
      status: 'Submitted',
      cvName: `${currentUser.name.replace(/\s+/g, '_')}_CV_2025.pdf`,
      coverLetter: `Hi Hiring Team at ${opp.company}, I am excited to apply for ${opp.title} via Upliftra Network.`,
    });
    setAppliedSuccessId(opp.id);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      // safe
    }
    setTimeout(() => {
      setAppliedSuccessId(null);
    }, 3000);
  };

  const upcomingSession: MentorshipSession | undefined = sessions[0];
  const spotlightEvent: PlatformEvent = events[0];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Profile Completion Progress Alert */}
      {profileComp.percentage < 100 && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 p-5 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#047857] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
              <span className="font-extrabold text-sm leading-none">{profileComp.percentage}%</span>
              <span className="text-[9px] uppercase font-bold opacity-80 mt-0.5">Profile</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Boost Your Career Placement Visibility
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {100 - profileComp.percentage}% Incomplete
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {profileComp.recommendations[0] || 'Complete your profile details to unlock automated verified recommendations.'}
              </p>
              <div className="w-full bg-slate-200/80 rounded-full h-2 mt-1 overflow-hidden max-w-md">
                <div
                  className="bg-[#047857] h-full rounded-full transition-all duration-500"
                  style={{ width: `${profileComp.percentage}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('profile')}
              className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Complete Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Welcome & Status Banner (Role-Aware) */}
      <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-6">
        {/* Ambient blur accents */}
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-emerald-100/50 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full bg-indigo-50/60 blur-2xl pointer-events-none"></div>

        <div className="relative p-6 lg:p-8 flex flex-col gap-5">
          {/* Title & Greeting Cluster */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col gap-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#97f5cc] text-[#002115] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#047857] animate-pulse"></span>
                  {isAdmin(currentUser.role)
                    ? 'Platform Command & Security Active'
                    : isMentor(currentUser.role)
                    ? 'Advisory Council & Mentorship Portal'
                    : isRecruiterOrCompany(currentUser.role)
                    ? 'Employer & Talent Acquisition Hub'
                    : 'Spring 2025 Cycle Active'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {currentUser.institution || currentUser.location || 'Pakistan Professional Network'} • Role:{' '}
                  <strong className="text-slate-800">{currentUser.role}</strong>
                </span>
              </div>

              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {isSuperAdmin(currentUser.role)
                  ? `Command Center — ${currentUser.name} 🛡️`
                  : isAdmin(currentUser.role)
                  ? `Administrator Console — ${currentUser.name} 🛡️`
                  : isMentor(currentUser.role)
                  ? `Assalam-o-Alaikum, Mentor ${currentUser.name}! 🎓`
                  : isRecruiterOrCompany(currentUser.role)
                  ? `Welcome, ${currentUser.name}! 💼`
                  : `Assalam-o-Alaikum, ${currentUser.name}! 🇵🇰`}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                {isAdmin(currentUser.role)
                  ? `Platform governance live. ${allUsers.length} registered accounts, ${opportunities.length} curated opportunities, and ${auditLogs.length} security audit events recorded.`
                  : isMentor(currentUser.role)
                  ? `Guiding aspiring Pakistani professionals. You have active mentorship slots and scheduled office hours ready.`
                  : isRecruiterOrCompany(currentUser.role)
                  ? `Discover vetted Pakistani talent. ${applications.length} candidates applied across the platform for opportunities.`
                  : `Your daily career compass: ${opportunities.length} new opportunities precisely match your profile today.`}
              </p>
            </div>

            {/* Quick Actions Cluster (Role-Aware) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {isAdmin(currentUser.role) ? (
                <>
                  {isSuperAdmin(currentUser.role) && (
                    <button
                      onClick={() => onNavigate('super-admin')}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-black transition-all shadow-xs text-xs font-bold cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-emerald-400" />
                      <span>Super Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate('admin-portal')}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs font-bold cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#047857]" />
                    <span>Admin Portal</span>
                  </button>

                </>
              ) : isMentor(currentUser.role) ? (
                <>
                  <button
                    onClick={() => onNavigate('1-on-1-mentorship')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] transition-all shadow-xs text-xs font-bold cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Mentorship Calendar</span>
                  </button>
                  <button
                    onClick={() => onNavigate('community-discussions')}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Community Q&A</span>
                  </button>
                </>
              ) : isRecruiterOrCompany(currentUser.role) ? (
                <>
                  <button
                    onClick={() => onNavigate('opportunities')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] transition-all shadow-xs text-xs font-bold cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Post Opportunity</span>
                  </button>
                  <button
                    onClick={() => onNavigate('applications-tracker')}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Review Applicants</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-slate-800 border border-slate-200/70 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-[#047857]" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        ATS Readiness
                      </span>
                      <span className="text-xs font-extrabold text-[#047857]">
                        {atsScore}% {atsScore >= 90 ? '(Exceptional)' : '(Optimized)'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleRunAtsScan}
                    disabled={isAtsScanning}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] transition-all shadow-xs text-xs font-bold disabled:opacity-75 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isAtsScanning ? 'animate-spin' : ''}`} />
                    <span>{isAtsScanning ? 'Scanning CV...' : 'Run AI Coach Scan'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Regional & Category Filter Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                Ecosystem Scope:
              </span>

              {[
                'All Pakistan',
                'Lahore (Tech Hub)',
                'Karachi (Finance/SaaS)',
                'Islamabad / Rawalpindi',
                'Remote Overseas',
                'HEC Attested Only',
              ].map((region) => {
                const isActive = selectedRegion === region;
                return (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-[#005d42] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>

            <div className="hidden xl:flex items-center gap-2 text-slate-400 text-xs font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
              <span>PKT Standard Time: UTC+5</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Metric Cards (4-Column Bento Grid - Role-Aware) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isAdmin(currentUser.role) ? (
          <>
            {/* Admin Metric 1: Registered Users */}
            <div
              onClick={() => onNavigate(isSuperAdmin(currentUser.role) ? 'super-admin' : 'admin-portal')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Accounts
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    {allUsers.length} Users
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-[#047857] group-hover:bg-[#047857] group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-emerald-700 font-bold">15 Active Roles</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                  RBAC Matrix
                </span>
              </div>
            </div>

            {/* Admin Metric 2: Platform Opportunities */}
            <div
              onClick={() => onNavigate('opportunities')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Catalog Items
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    {opportunities.length} Listed
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-indigo-700 font-bold">Verified Partners</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  Jobs & Aid
                </span>
              </div>
            </div>

            {/* Admin Metric 3: Applications Processed */}
            <div
              onClick={() => onNavigate('applications-tracker')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Submissions
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    {applications.length} Processed
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                  <Send className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-amber-700 font-bold">Direct Pipeline</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  CV Dossiers
                </span>
              </div>
            </div>

            {/* Admin Metric 4: Audit Trail */}
            <div
              onClick={() => onNavigate(isSuperAdmin(currentUser.role) ? 'super-admin' : 'admin-portal')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Audit Logging
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    {auditLogs.length} Events
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700 group-hover:bg-rose-700 group-hover:text-white transition-colors">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-rose-700 font-bold">Tamper Evident</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  SHA-256
                </span>
              </div>
            </div>
          </>
        ) : isMentor(currentUser.role) ? (
          <>
            {/* Mentor Metric 1: Sessions */}
            <div
              onClick={() => onNavigate('1-on-1-mentorship')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Office Hours
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    {sessions.length} Scheduled
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-[#047857] group-hover:bg-[#047857] group-hover:text-white transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[#047857] font-bold">1 Upcoming Tomorrow</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  Google Meet
                </span>
              </div>
            </div>

            {/* Mentor Metric 2: Mentees Guided */}
            <div
              onClick={() => onNavigate('1-on-1-mentorship')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Mentees Guided
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    18 Talents
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-indigo-700 font-bold">FAST / NUST / GIKI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  Tech Focus
                </span>
              </div>
            </div>

            {/* Mentor Metric 3: Rating */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Feedback Rating
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    4.9 / 5.0 ⭐
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-amber-700 font-bold">Top 5% Mentor</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  18 Reviews
                </span>
              </div>
            </div>

            {/* Mentor Metric 4: Community Answers */}
            <div
              onClick={() => onNavigate('community-discussions')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Community Advice
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    12 Answered
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#97f5cc] flex items-center justify-center text-[#002115] group-hover:bg-[#047857] group-hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[#047857] font-bold">Active Threads</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  Join Discussion
                </span>
              </div>
            </div>
          </>
        ) : isRecruiterOrCompany(currentUser.role) ? (
          <>
            {/* Recruiter Metric 1: Open Opportunities */}
            <div
              onClick={() => onNavigate('opportunities')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Listings
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    {opportunities.length} Open
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-[#047857] group-hover:bg-[#047857] group-hover:text-white transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[#047857] font-bold">Verified Status</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  Jobs & Internships
                </span>
              </div>
            </div>

            {/* Recruiter Metric 2: Applications */}
            <div
              onClick={() => onNavigate('applications-tracker')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Applicant Pool
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    {applications.length} Candidates
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-indigo-700 font-bold">2 Ready for Interview</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  Review Now
                </span>
              </div>
            </div>

            {/* Recruiter Metric 3: Candidate Match */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Talent Match
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    94% Fit Rate
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-amber-700 font-bold">AI Skill Verification</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  Screened
                </span>
              </div>
            </div>

            {/* Recruiter Metric 4: Placement Speed */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Placement Speed
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    8 Days Avg
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#97f5cc] flex items-center justify-center text-[#002115]">
                  <Rocket className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[#047857] font-bold">Fast-Track Hiring</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  Direct Contact
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Student Metric 1: Active Applications */}
            <div
              onClick={() => onNavigate('applications-tracker')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Pipeline
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    {applications.length} Submitted
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-[#047857] group-hover:bg-[#047857] group-hover:text-white transition-colors">
                  <Send className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                  <div className="bg-[#005d42] h-full w-2/12" title="Interview"></div>
                  <div className="bg-[#047857] h-full w-4/12" title="Shortlisted"></div>
                  <div className="bg-slate-300 h-full w-6/12" title="Under Review"></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-[#047857] font-bold">1 Interview Set</span>
                  <span>2 Shortlisted (Systems & Arbisoft)</span>
                </div>
              </div>
            </div>

            {/* Student Metric 2: Scholarships */}
            <div
              onClick={() => onNavigate('opportunities')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Fellowships & Aid
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    4 Available
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Fulbright 2026 Closes Soon</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  USEFP / DAAD
                </span>
              </div>
            </div>

            {/* Student Metric 3: Mentorship Hours */}
            <div
              onClick={() => onNavigate('1-on-1-mentorship')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Mentorship
                  </span>
                  <span className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                    4.5 hrs Total
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#97f5cc] flex items-center justify-center text-[#002115] group-hover:bg-[#047857] group-hover:text-white transition-colors">
                  <Volume2 className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#047857] animate-ping"></span>
                  <span className="text-xs text-[#047857] font-bold">Next: Careem Staff Eng</span>
                </div>
                <span className="text-[11px] text-slate-400">Tomorrow 7PM PKT</span>
              </div>
            </div>

            {/* Student Metric 4: Skill Match Score */}
            <div
              onClick={() => onNavigate('ai-career-coach-ats-reviewer')}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Target Match
                  </span>
                  <span className="font-display font-extrabold text-xl text-[#047857] mt-0.5">
                    92% React / AI
                  </span>
                </div>

                {/* Circular gauge */}
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-[#047857]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="92, 100"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <Sparkles className="w-3.5 h-3.5 text-[#047857] absolute" />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="text-slate-400">Suggested boost:</span>
                <span className="text-slate-800 font-bold truncate max-w-[140px]">
                  TypeScript Runtime AST
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Ecosystem Modules Launchpad */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Upliftra Ecosystem Modules
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Seamless National Collaboration
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('networking')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-start gap-2 text-left group transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                Networking
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1">
                Alumni & Peers
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('learning-hub')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-start gap-2 text-left group transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                Learning Hub
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1">
                Tracks & Certificates
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('community-discussions')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-start gap-2 text-left group transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                Community
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1">
                Q&A & Career Advice
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('startups-co-founder-matching')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-start gap-2 text-left group transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                Startups
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1">
                Co-Founder Matching
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-start gap-2 text-left group transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                My Profile
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1">
                {currentUser.profileCompletion || 75}% Complete
              </span>
            </div>
          </button>

          {isAdmin(currentUser.role) ? (
            <button
              onClick={() => onNavigate('admin-portal')}
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 flex flex-col items-start gap-2 text-left group transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="font-display font-bold text-xs text-rose-900 dark:text-rose-200 block">
                  Admin Console
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 line-clamp-1">
                  Governance Hub
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('messages')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-start gap-2 text-left group transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white block group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                  Messages
                </span>
                <span className="text-[10px] text-slate-500 line-clamp-1">
                  Inquiries & Chats
                </span>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Main 2-Column Dashboard Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Opportunities Feed & Roadmap (8 Cols on LG) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Opportunities Section */}
          <section className="rounded-2xl bg-white p-5 lg:p-6 border border-slate-200/80 shadow-xs flex flex-col gap-5">
            {/* Header & Category Sub-tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Verified Discovery Engine
                </span>
                <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
                  <span>Curated Opportunities</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#dae2fd] text-[#131b2e]">
                    Live Sync
                  </span>
                </h2>
              </div>

              {/* Tab Bar */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 overflow-x-auto no-scrollbar">
                {[
                  'Recommended for You',
                  'High-Stipend Internships',
                  'Global Scholarships',
                  'Fresh Grad Trainee',
                ].map((tab) => {
                  const isActive = selectedCategoryTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setSelectedCategoryTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-white text-[#047857] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of Opportunities */}
            <div className="flex flex-col gap-4">
              {filteredOpportunities.slice(0, 4).map((opp) => {
                const isBookmarked = bookmarkedIds.includes(opp.id);
                const isApplied = appliedSuccessId === opp.id;

                return (
                  <article
                    key={opp.id}
                    onClick={() => onSelectOpportunity(opp)}
                    className="p-5 rounded-xl bg-[#f8f9ff]/70 hover:bg-[#f1f5f9] transition-all border border-slate-200/70 shadow-xs flex flex-col gap-3 group cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <img
                          src={opp.logo}
                          alt={opp.company}
                          className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200/60 shrink-0"
                        />
                        <div className="flex flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{opp.company}</span>
                            <span className="inline-flex items-center gap-1 text-[#047857] text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-[#047857] text-white" />
                              {opp.partnerType || 'Verified Partner'}
                            </span>
                            {opp.aiMatchScore && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#97f5cc] text-[#002115]">
                                {opp.aiMatchScore}% AI Match
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-[#047857] transition-colors mt-0.5">
                            {opp.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {opp.location}
                            </span>
                            <span>•</span>
                            <span className="font-bold text-[#047857]">{opp.salary}</span>
                            <span>•</span>
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Deadline: {opp.deadline}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleBookmarkToggle(opp.id, e)}
                        className={`self-end sm:self-start p-2 rounded-lg transition-colors ${
                          isBookmarked
                            ? 'text-[#047857] bg-emerald-50'
                            : 'text-slate-400 hover:text-[#047857] hover:bg-slate-100'
                        }`}
                        title="Bookmark Opportunity"
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {opp.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/50">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {opp.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-600 border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOpportunity(opp);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                        >
                          View Details
                        </button>

                        <button
                          onClick={(e) => handleOneClickApply(opp, e)}
                          disabled={isApplied}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all ${
                            isApplied
                              ? 'bg-[#10b981] text-white'
                              : 'bg-[#047857] text-white hover:bg-[#065f46]'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Application Logged!</span>
                            </>
                          ) : (
                            <>
                              <span>1-Click Apply</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination & Complete Directory Link */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs font-medium">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#047857]" />
                <span>
                  Displaying {Math.min(4, filteredOpportunities.length)} of 1,420 cached opportunities
                </span>
              </div>

              <button
                onClick={() => onNavigate('opportunities')}
                className="text-[#047857] hover:underline font-bold flex items-center gap-1"
              >
                <span>Browse Complete Directory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Career Readiness Roadmap 2025 */}
          <section className="rounded-2xl bg-white p-5 lg:p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Graduation Transition Strategy
                </span>
                <h2 className="font-display font-bold text-xl text-slate-900">
                  Career Readiness Roadmap 2025
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#97f5cc] text-[#002115] w-fit">
                Step 3 of 4 in Progress
              </span>
            </div>

            {/* Multi-step Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-[#047857] text-white flex items-center justify-center text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] text-[#047857] font-bold">100% Done</span>
                </div>
                <h4 className="font-display font-bold text-xs text-slate-900">1. Profile & CV</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Full-stack portfolio + ATS resume optimized for Pakistani recruiters.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-[#047857] text-white flex items-center justify-center text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] text-[#047857] font-bold">HEC Verified</span>
                </div>
                <h4 className="font-display font-bold text-xs text-slate-900">2. Degree Attestation</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  NUST transcript e-verified. Ready for multinational background checks.
                </p>
              </div>

              {/* Step 3 (Active) */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border-2 border-[#047857] shadow-xs flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-[#047857] text-white flex items-center justify-center text-xs font-bold animate-pulse">
                    3
                  </span>
                  <span className="text-[10px] text-[#047857] font-bold">In Progress</span>
                </div>
                <h4 className="font-display font-bold text-xs text-slate-900">3. Mock Interviews</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Careem staff mentor interview booked for tomorrow evening.
                </p>
              </div>

              {/* Step 4 (Upcoming) */}
              <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/50 flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Upcoming</span>
                </div>
                <h4 className="font-display font-bold text-xs text-slate-900">4. Offer Selection</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Salary negotiation benchmark (PKR 140k avg for Islamabad/Lahore).
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Sidebar Widgets (4 Cols on LG) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* WIDGET 1: AI Career Coach & ATS (Client-side) */}
          <section className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#047857] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xs text-slate-900">AI Career Coach</h3>
                  <span className="text-[10px] text-[#047857] font-semibold">
                    Local Browser Model • Private
                  </span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#10b981]" title="Model Ready"></span>
            </div>

            {/* Conversational Insight Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Real-time Talent Insight (Lahore & Islamabad)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                14 engineering recruiters searched for{' '}
                <strong className="text-slate-900">"Next.js 15 Server Components"</strong> and{' '}
                <strong className="text-slate-900">"Tailwind responsive layout"</strong> in the last
                72 hours. Adding your GitHub repo could bump your recruiter discovery by 34%.
              </p>
            </div>

            {/* Quick Interactive Prompt Pills */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Quick Local Commands
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '⚡ Analyze CV for Systems Ltd',
                  '✉️ Outreach to NUST Alumni',
                  '💰 Salary Comparison PK',
                ].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => handleQuickPrompt(cmd)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-[#047857] text-slate-700 text-[11px] font-medium transition-colors text-left"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <div className="relative mt-1">
              <input
                type="text"
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                placeholder="Ask AI Coach anything regarding your Pakistani job hunt..."
                className="w-full h-11 pl-3 pr-10 rounded-xl bg-slate-100 text-slate-800 placeholder:text-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#047857] border border-transparent focus:border-[#047857] transition-all"
              />
              <button
                onClick={handleAiSend}
                className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg bg-[#047857] text-white hover:bg-[#065f46] flex items-center justify-center transition-colors shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {aiFeedbackMessage && (
              <span className="text-[11px] text-[#047857] font-medium bg-emerald-50 px-2.5 py-1 rounded-lg animate-in fade-in">
                {aiFeedbackMessage}
              </span>
            )}
          </section>

          {/* WIDGET 2: Upcoming 1-on-1 Mentorship */}
          {upcomingSession && (
            <section className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Handshake className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xs text-slate-900">
                      Upcoming Mentorship
                    </h3>
                    <span className="text-[10px] text-slate-400">Pro Bono Session for Students</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#97f5cc] text-[#002115]">
                  Confirmed
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={upcomingSession.mentorAvatar}
                    alt={upcomingSession.mentorName}
                    className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/20"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <h4 className="font-display font-bold text-xs text-slate-900">
                        {upcomingSession.mentorName}
                      </h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] fill-[#047857]" />
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium">
                      Lead Architect @ Delivery Hero
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Ex-Careem • FAST Islamabad Alumnus
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 text-xs flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Session Objective:
                  </span>
                  <span className="font-bold text-slate-900 leading-snug">
                    "{upcomingSession.topic}"
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#047857] font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{upcomingSession.scheduledTime}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={upcomingSession.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-lg bg-[#047857] text-white hover:bg-[#065f46] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Zoom</span>
                  </a>
                  <button
                    onClick={() => onNavigate('1-on-1-mentorship')}
                    className="py-2 px-3 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-semibold flex items-center justify-center transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            </section>
          )}


          {/* WIDGET 4: Tech Summits in Pakistan */}
          {spotlightEvent && (
            <section className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-xs text-slate-900">Events & Summits</h3>
                <span
                  onClick={() => onNavigate('events-webinars')}
                  className="text-[11px] text-[#047857] hover:underline cursor-pointer font-bold"
                >
                  View All
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                      Registrations Closing
                    </span>
                    <h4 className="font-display font-bold text-xs text-slate-900 mt-0.5">
                      {spotlightEvent.title}
                    </h4>
                    <span className="text-[11px] text-slate-500">{spotlightEvent.location}</span>
                  </div>

                  <div className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-center shrink-0 shadow-xs">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">MAY</span>
                    <span className="font-display font-extrabold text-base text-[#047857] leading-none">
                      16
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Prize Pool: {spotlightEvent.prizePool || 'PKR 500,000'}
                  </span>
                  <button
                    onClick={() => onNavigate('events-webinars')}
                    className="px-3 py-1 rounded-lg bg-[#047857] text-white hover:bg-[#065f46] text-xs font-semibold transition-colors"
                  >
                    Register Free
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
