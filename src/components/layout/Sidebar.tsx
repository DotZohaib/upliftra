import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  ClipboardCheck,
  Handshake,
  GraduationCap,
  BrainCircuit,
  MessageSquareShare,
  Rocket,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
  Settings,
  Download,
  DatabaseZap,
  X,
  Users,
  MessageSquare,
  UserCheck,
  ShieldAlert,
  Facebook,
  Instagram,
  Linkedin,
} from 'lucide-react';
import { getCurrentUser } from '../../lib/storage';
import { isAdmin, isSuperAdmin } from '../../lib/permissions';

interface SidebarProps {
  currentView: string;
  onNavigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const currentUser = getCurrentUser();
  const hasAdminAccess = isAdmin(currentUser.role) || isSuperAdmin(currentUser.role);

  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      icon: Briefcase,
      badge: '1,420+',
    },
    {
      id: 'applications-tracker',
      label: 'Applications Tracker',
      icon: ClipboardCheck,
    },
    {
      id: 'networking',
      label: 'Networking & People',
      icon: Users,
    },
    {
      id: 'messages',
      label: 'Direct Messages',
      icon: MessageSquare,
    },
    {
      id: '1-on-1-mentorship',
      label: '1-on-1 Mentorship',
      icon: Handshake,
    },
    {
      id: 'learning-hub',
      label: 'Learning Hub',
      icon: GraduationCap,
    },
    {
      id: 'ai-career-coach-ats-reviewer',
      label: 'AI Career Coach & ATS',
      icon: BrainCircuit,
    },
    {
      id: 'community-discussions',
      label: 'Community & Forum',
      icon: MessageSquareShare,
    },
    {
      id: 'startups-co-founder-matching',
      label: 'Startups & Matching',
      icon: Rocket,
    },
    {
      id: 'events-webinars',
      label: 'Events & Webinars',
      icon: Calendar,
    },
    {
      id: 'profile',
      label: 'My Profile & CV',
      icon: UserCheck,
    },
  ];

  const adminNavItems = [
    ...(hasAdminAccess
      ? [
          {
            id: 'admin-portal',
            label: 'Admin Console',
            icon: ShieldAlert,
            badge: 'Governance',
          },
          {
            id: 'settings-rbac-permissions',
            label: 'Settings & Permissions',
            icon: Settings,
          },
        ]
      : []),
    {
      id: 'role-based-portals',
      label: 'Role-Based Portals',
      icon: ShieldCheck,
      badge: '15 Roles',
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full overflow-y-auto py-4 px-3">
      <div className="flex flex-col gap-5">
        {/* Mobile close button */}
        <div className="flex items-center justify-between lg:hidden px-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold">
              U
            </div>
            <span className="font-display font-bold text-slate-800 dark:text-white">Upliftra Navigation</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Modules */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Modules
          </span>
          <nav className="flex flex-col gap-0.5 mt-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Governance & Admin Controls */}
        <div className="flex flex-col gap-1 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Administration & Data
          </span>
          <nav className="flex flex-col gap-0.5 mt-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Community Footer */}
      <div className="mt-auto px-4 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <p className="text-[10px] text-slate-500 text-center leading-relaxed font-medium mb-3">
          Grow this community together. Let's learn, connect, and grow together! 🌱
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="https://www.facebook.com/Upliftra.Network" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#1877F2] transition-colors">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="https://www.instagram.com/Upliftra.Network/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#E4405F] transition-colors">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="https://www.linkedin.com/company/upliftra-network/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#0A66C2] transition-colors">
            <Linkedin className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 z-30 hidden lg:block shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
