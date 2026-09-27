import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building,
  GraduationCap,
  Briefcase,
  Rocket,
  Users,
  Award,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { UserRole, User } from '../../types';
import { getCurrentUser, switchUserByRole } from '../../lib/storage';
import confetti from 'canvas-confetti';

interface PortalInfo {
  role: UserRole;
  category: 'Talent & Candidates' | 'Enterprise & Employers' | 'Academic & Institutions' | 'Platform Ops & Admin';
  tagline: string;
  keyFeatures: string[];
  metrics: string;
  badgeColor: string;
}

export const PortalsView: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [currentUser, setCurrentUser] = useState<User>(getCurrentUser());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const portals: PortalInfo[] = [
    {
      role: 'Student',
      category: 'Talent & Candidates',
      tagline: 'Internships, scholarships, mentorship & entry-level career acceleration.',
      keyFeatures: ['1-Click Fast Apply', 'ATS Resume Scanner', 'HEC Degree Attestation Tracker', 'Pro Bono Mentorship Slots'],
      metrics: '1,420+ Opportunities Available',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      role: 'Professional',
      category: 'Talent & Candidates',
      tagline: 'Mid-to-senior lateral hiring, remote USD roles & startup co-founder discovery.',
      keyFeatures: ['Salary Benchmarking PK', 'Executive Search Invites', 'Co-Founder Matching', 'Technical Interview Prep'],
      metrics: '450+ Mid/Senior Openings',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      role: 'Mentor',
      category: 'Talent & Candidates',
      tagline: 'Offer 1-on-1 guidance to Pakistani youth, review SOPs & conduct mock interviews.',
      keyFeatures: ['Calendar Slot Availability', 'Pro Bono Hours Tracker', 'Zoom Integration', 'Mentee Ratings & Reviews'],
      metrics: '48 Active Pakistani Mentors',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      role: 'Recruiter',
      category: 'Enterprise & Employers',
      tagline: 'Candidate sourcing, pipeline management & campus hiring across Pakistani universities.',
      keyFeatures: ['Post Openings Instantly', 'Candidate ATS Pre-screening', 'Direct Interview Scheduling', 'Export Applications (.xlsx)'],
      metrics: '18 Active Job Postings',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      role: 'Company',
      category: 'Enterprise & Employers',
      tagline: 'Enterprise employer brand profile, multinational hiring & internship drives.',
      keyFeatures: ['Company Branding Page', 'Batch Trainee Hiring', 'University MoU Management', 'Verified Partner Badge'],
      metrics: 'Verified Enterprise Entity',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      role: 'Startup/Founder',
      category: 'Enterprise & Employers',
      tagline: 'NIC/Plan9 startup ecosystem, find technical co-founders & hire early engineers.',
      keyFeatures: ['Post Looking-for Co-Founder', 'Pitch Deck Showcase', 'Equity/Salary Splits', 'Incubator Network'],
      metrics: '12 Featured PK Startups',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      role: 'University',
      category: 'Academic & Institutions',
      tagline: 'University career placement center (NUST, FAST, LUMS, NED, GIKI).',
      keyFeatures: ['Batch Student Dossier Sync', 'On-Campus Placement Drives', 'Alumni Tracking', 'HEC Accreditation Verification'],
      metrics: '3,800+ Students Registered',
      badgeColor: 'bg-cyan-100 text-cyan-800',
    },
    {
      role: 'Organization',
      category: 'Academic & Institutions',
      tagline: 'USEFP, British Council, DAAD, P@SHA, and government digital bodies.',
      keyFeatures: ['Publish National Fellowships', 'Scholarship Quotas', 'Diplomatic Exchange Programs', 'Verification Stamps'],
      metrics: '8 Diplomatic Fellowships Active',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      role: 'Volunteer',
      category: 'Academic & Institutions',
      tagline: 'Community development, charity education drives & flood relief initiatives.',
      keyFeatures: ['Community Outreach Log', 'Volunteer Hours Certificate', 'Event Organizing', 'Civic Impact Badges'],
      metrics: '120+ Volunteer Hours',
      badgeColor: 'bg-orange-100 text-orange-800',
    },
    {
      role: 'Campus Ambassador',
      category: 'Academic & Institutions',
      tagline: 'Represent Upliftra on campus, organize student sign-up drives & workshops.',
      keyFeatures: ['Referral Tracking Code', 'University Event Passes', 'Student Ambassador Leaderboard', 'Direct HQ Line'],
      metrics: '24 Campuses Active',
      badgeColor: 'bg-lime-100 text-lime-800',
    },
    {
      role: 'Partner',
      category: 'Academic & Institutions',
      tagline: 'Industry alliances, accreditation providers & corporate sponsorship.',
      keyFeatures: ['Sponsorship Analytics', 'Co-Branded Competitions', 'API & Excel Data Sync', 'Ecosystem Reports'],
      metrics: 'National Technology Partner',
      badgeColor: 'bg-sky-100 text-sky-800',
    },
    {
      role: 'Moderator',
      category: 'Platform Ops & Admin',
      tagline: 'Content moderation, review community posts & flag fraudulent job scams.',
      keyFeatures: ['Post Approval Queue', 'Flagged Content Review', 'Spam / Scam Filters', 'Ban / Mute User Control'],
      metrics: 'Clean Discussion Community',
      badgeColor: 'bg-yellow-100 text-yellow-800',
    },
    {
      role: 'Trainer',
      category: 'Platform Ops & Admin',
      tagline: 'Course authors, bootcamp instructors & professional certification mentors.',
      keyFeatures: ['Curriculum Module Editor', 'Student Enrolment Analytics', 'Quiz & Assignment Grader', 'Certificate Issuance'],
      metrics: '3 Courses Published',
      badgeColor: 'bg-violet-100 text-violet-800',
    },
    {
      role: 'Admin',
      category: 'Platform Ops & Admin',
      tagline: 'Platform management, Excel catalog operations & recruiter verification.',
      keyFeatures: ['Catalog Excel Manager', 'User Account Approval', 'Security Audits', 'Broadcast Announcements'],
      metrics: 'Full Platform Access',
      badgeColor: 'bg-slate-200 text-slate-800',
    },
    {
      role: 'Super Admin',
      category: 'Platform Ops & Admin',
      tagline: 'Master governance, RBAC permissions editor & full database recovery.',
      keyFeatures: ['RBAC Permissions Matrix', 'System Database Reset', 'Full Excel Import/Export', 'All-Role Bypass'],
      metrics: 'Highest Tier Privileges',
      badgeColor: 'bg-red-100 text-red-900 font-bold',
    },
  ];

  const categories = ['All', 'Talent & Candidates', 'Enterprise & Employers', 'Academic & Institutions', 'Platform Ops & Admin'];

  const filteredPortals = portals.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  const handleSwitchRole = (role: UserRole) => {
    const updatedUser = switchUserByRole(role);
    setCurrentUser(updatedUser);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
    } catch (e) {}
    window.dispatchEvent(new Event('upliftra_data_changed'));
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              15 Role-Based Portals Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#97f5cc] text-[#002115]">
              Full Frontend RBAC
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Explore and test all 15 personalized platform roles built for Pakistan’s students, universities, recruiters, founders, and administrators.
          </p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-xs">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Active Role</span>
            <span className="text-xs font-extrabold text-[#047857]">{currentUser.role}</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#047857] animate-pulse"></span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === c
                ? 'bg-[#005d42] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPortals.map((p) => {
          const isActive = currentUser.role === p.role;
          return (
            <div
              key={p.role}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                isActive
                  ? 'bg-white border-[#047857] shadow-md ring-2 ring-[#047857]/20'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {p.category}
                    </span>
                    <h3 className="font-display font-bold text-base text-slate-900 mt-0.5">
                      {p.role} Portal
                    </h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${p.badgeColor}`}>
                    {isActive ? 'Active Persona' : p.metrics}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {p.tagline}
                </p>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Custom Features:
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-700">
                    {p.keyFeatures.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleSwitchRole(p.role)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    isActive
                      ? 'bg-[#005d42] text-white'
                      : 'bg-slate-100 hover:bg-[#047857] text-slate-800 hover:text-white'
                  }`}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Currently Logged In as {p.role}</span>
                    </>
                  ) : (
                    <>
                      <span>Switch Persona & Enter as {p.role}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
