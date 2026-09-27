import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Database,
  Bell,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  FileSpreadsheet,
  LogOut,
  UserCheck,
  Sparkles,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { User, UserRole, NotificationItem } from '../../types';
import {
  getCurrentUser,
  switchUserByRole,
  logoutUser,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getStorageStats,
} from '../../lib/storage';
import { invalidateSession } from '../../lib/auth';
import { authApi } from '../../lib/api';
import { isSuperAdmin, isAdmin } from '../../lib/permissions';

interface HeaderProps {
  currentView: string;
  onNavigate: (path: string) => void;
  onOpenMobileMenu: () => void;
  onOpenAuthModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ALL_ROLES: UserRole[] = [
  'Student',
  'Professional',
  'Mentor',
  'Recruiter',
  'Company',
  'Startup/Founder',
  'University',
  'Organization',
  'Volunteer',
  'Campus Ambassador',
  'Partner',
  'Moderator',
  'Trainer',
  'Admin',
  'Super Admin',
];

export const Header: React.FC<HeaderProps> = ({
  currentView: _currentView,
  onNavigate,
  onOpenMobileMenu,
  onOpenAuthModal,
  searchQuery,
  setSearchQuery,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(getCurrentUser());
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [storageStats, setStorageStats] = useState({ totalKb: 0, itemsCount: 0 });

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync state
  useEffect(() => {
    setCurrentUser(getCurrentUser());
    setNotifications(getNotifications());
    setStorageStats(getStorageStats());

    // Listen for storage changes across tabs or views
    const handleStorageUpdate = () => {
      setCurrentUser(getCurrentUser());
      setNotifications(getNotifications());
      setStorageStats(getStorageStats());
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('upliftra_data_changed', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('upliftra_data_changed', handleStorageUpdate);
    };
  }, []);

  // Keyboard shortcut ⌘K or Ctrl+K to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = (role: UserRole) => {
    const switched = switchUserByRole(role);
    setCurrentUser(switched);
    setShowRoleDropdown(false);
    window.dispatchEvent(new Event('upliftra_data_changed'));
  };

  const handleSignOut = async () => {
    setShowUserDropdown(false);
    
    // 1. Call API to clear backend cookie
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('API logout failed', e);
    }
    
    // 2. Clear local storage
    try {
      invalidateSession(true);
    } catch {
      logoutUser();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between gap-3 shadow-xs">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-xl bg-[#005d42] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-xl font-bold tracking-tighter">U</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] ml-0.5 -mt-2"></span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-display font-extrabold text-lg text-[#005d42] tracking-tight">
                Upliftra
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
              Network Pakistan
            </span>
          </div>
        </div>

        <span className="hidden xl:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#dae2fd] text-[#131b2e] uppercase tracking-wider">
          Pakistan Opportunity Ecosystem
        </span>
      </div>

      {/* Global Search with ⌘K */}
      <div className="flex-1 max-w-xl mx-2 hidden md:flex items-center relative">
        <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search jobs, scholarships, mentors, startups in Karachi, Lahore, Islamabad, remote..."
          className="w-full h-10 pl-10 pr-14 rounded-lg bg-slate-100/90 text-slate-800 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#047857] transition-all border border-transparent focus:border-[#047857]"
        />
        <span className="absolute right-3 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-600 pointer-events-none">
          ⌘K
        </span>
      </div>

      {/* Right Controls & Role Switcher */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Role Switcher — visible to Admin / Super Admin only for impersonation */}
        {(isAdmin(currentUser.role)) && (
          <div className="relative" ref={roleDropdownRef}>
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors border border-amber-200"
              title="Admin: Switch impersonation role"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="max-w-[110px] sm:max-w-[140px] truncate">{currentUser.role}</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-64 max-h-96 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                    🛡 Admin: Impersonate Role
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Switch active persona for testing. Audit-logged.</p>
                </div>
                {ALL_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                      currentUser.role === role ? 'text-[#047857] bg-emerald-50/70 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{role}</span>
                    {currentUser.role === role && <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current role badge for non-admin users */}
        {!isAdmin(currentUser.role) && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
            <span className="max-w-[110px] sm:max-w-[140px] truncate">{currentUser.role}</span>
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#f59e0b] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notifications ({notifications.length})
                </h4>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      markAllNotificationsAsRead();
                      setNotifications(getNotifications());
                    }}
                    className="text-[11px] text-[#047857] hover:underline font-semibold"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-400">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        setNotifications(getNotifications());
                        if (n.linkTo) onNavigate(n.linkTo);
                        setShowNotifDropdown(false);
                      }}
                      className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col gap-1 ${
                        !n.read ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{n.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Messages Popover Shortcut */}
        <button
          onClick={() => onNavigate('messages')}
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Direct Messages"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#047857] text-white text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </button>

        {/* User Profile Avatar & Menu */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 pl-1 group"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20 group-hover:ring-emerald-500 transition-all"
            />
            <div className="hidden 2xl:flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                  {currentUser.verificationStatus}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                {currentUser.title}
              </span>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#047857] text-white">
                  Role: {currentUser.role}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>My Profile & Resume</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('networking');
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Professional Network</span>
                </button>
                {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
                  <button
                    onClick={() => {
                      onNavigate('admin-portal');
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Admin Governance Console</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onNavigate('ai-career-coach-ats-reviewer');
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>AI Career Coach</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1 space-y-0.5">
                {isSuperAdmin(currentUser.role) && (
                  <button
                    onClick={() => {
                      onNavigate('super-admin');
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    <span>Super Admin Console</span>
                  </button>
                )}

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
