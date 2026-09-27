import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { AuthPortal } from './components/auth/AuthPortal';
import { Opportunity, User } from './types';
import { initLocalStorage, getCurrentUser, setCurrentUser as setCurrentUserLocal } from './lib/storage';
import { hasAuthenticatedSession, getActiveSession, initializeAuthCredentials } from './lib/auth';
import { canAccessPath } from './lib/permissions';
import { authApi, checkServerHealth } from './lib/api';
import { syncDatabaseWithServer } from './lib/sync';
import { ShieldAlert, Home, Loader2, WifiOff } from 'lucide-react';

// ── Lazy-loaded views (code split for faster initial load) ────────────────
const DashboardView     = lazy(() => import('./components/views/DashboardView').then(m => ({ default: m.DashboardView })));
const OpportunitiesView = lazy(() => import('./components/views/OpportunitiesView').then(m => ({ default: m.OpportunitiesView })));
const ApplicationsView  = lazy(() => import('./components/views/ApplicationsView').then(m => ({ default: m.ApplicationsView })));
const MentorshipView    = lazy(() => import('./components/views/MentorshipView').then(m => ({ default: m.MentorshipView })));
const LearningView      = lazy(() => import('./components/views/LearningView').then(m => ({ default: m.LearningView })));
const AICoachView       = lazy(() => import('./components/views/AICoachView').then(m => ({ default: m.AICoachView })));
const CommunityView     = lazy(() => import('./components/views/CommunityView').then(m => ({ default: m.CommunityView })));
const StartupsView      = lazy(() => import('./components/views/StartupsView').then(m => ({ default: m.StartupsView })));
const EventsView        = lazy(() => import('./components/views/EventsView').then(m => ({ default: m.EventsView })));
const MessagesView      = lazy(() => import('./components/views/MessagesView').then(m => ({ default: m.MessagesView })));
const PortalsView       = lazy(() => import('./components/views/PortalsView').then(m => ({ default: m.PortalsView })));
const SettingsView      = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const ProfileView       = lazy(() => import('./components/views/ProfileView').then(m => ({ default: m.ProfileView })));
const NetworkingView    = lazy(() => import('./components/views/NetworkingView').then(m => ({ default: m.NetworkingView })));
const AdminPortalView   = lazy(() => import('./components/views/AdminPortalView').then(m => ({ default: m.AdminPortalView })));
const SuperAdminView    = lazy(() => import('./components/views/SuperAdminView').then(m => ({ default: m.SuperAdminView })));

// ── Loading Fallback ──────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[40vh] w-full">
    <div className="flex flex-col items-center gap-3 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-[#047857]" />
      <span className="text-xs font-medium">Loading...</span>
    </div>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(getCurrentUser());
  const [hasSession, setHasSession] = useState<boolean>(() => hasAuthenticatedSession());
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // ── Initialize storage + session (API-first, localStorage fallback) ──────
  useEffect(() => {
    initLocalStorage();
    (async () => {
      await initializeAuthCredentials();

      // 1. Try to restore session from API server (JWT cookie)
      const health = await checkServerHealth();
      if (health.online) {
        setIsOfflineMode(!health.sheetsConfigured);
        const sessionRes = await authApi.session();
        if (sessionRes.success && sessionRes.user) {
          setCurrentUserLocal(sessionRes.user as User);
          setCurrentUser(sessionRes.user as User);
          setHasSession(true);
          setIsCheckingSession(false);
          syncDatabaseWithServer();
          return;
        }
        // API online but no valid JWT → check localStorage too
      } else {
        setIsOfflineMode(true);
      }

      // 2. Fallback: check localStorage session
      const active = getActiveSession();
      if (active.isExpired) {
        setHasSession(false);
        setSessionExpiredNotice('Your session has expired. Please sign in again.');
      } else if (active.session && active.user) {
        setHasSession(true);
        setCurrentUser(active.user);
        if (health.online) syncDatabaseWithServer();
      } else {
        const hasSess = hasAuthenticatedSession();
        setHasSession(hasSess);
        setCurrentUser(getCurrentUser());
        if (hasSess && health.online) syncDatabaseWithServer();
      }
      setIsCheckingSession(false);
    })();

    const handleDataChanged = () => {
      const active = getActiveSession();
      if (active.isExpired) {
        setHasSession(false);
        setSessionExpiredNotice('Your session has expired for security. Please sign in again to continue.');
        if (typeof window !== 'undefined' && window.history)
          window.history.replaceState(null, '', window.location.href);
      } else if (active.session && active.user) {
        setHasSession(true);
        setCurrentUser(active.user);
      } else {
        setHasSession(false);
        setSessionExpiredNotice(null);
      }
    };

    window.addEventListener('upliftra_data_changed', handleDataChanged);
    window.addEventListener('upliftra_auth_state_changed', handleDataChanged);

    // Periodic session validation — prefer API, fallback to localStorage
    const sessionInterval = setInterval(async () => {
      if (!isOfflineMode) {
        const sessionRes = await authApi.session();
        if (!sessionRes.success && !sessionRes.offline) {
          setHasSession(false);
          setSessionExpiredNotice('Your session has expired. Please sign in again.');
          return;
        }
      }
      const active = getActiveSession();
      if (active.isExpired) {
        setHasSession(false);
        setSessionExpiredNotice('Your session has expired for security. Please sign in again.');
      }
    }, 30000);

    return () => {
      window.removeEventListener('upliftra_data_changed', handleDataChanged);
      window.removeEventListener('upliftra_auth_state_changed', handleDataChanged);
      clearInterval(sessionInterval);
    };
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentView(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setCurrentView('opportunities');
  };

  // Checking session state — show spinner
  if (isCheckingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#047857]" />
          <span className="text-sm font-medium">Connecting to Upliftra Network...</span>
        </div>
      </div>
    );
  }

  // If visitor is not authenticated or session has expired, show Full-Screen Auth Portal
  if (!hasSession) {
    return (
      <AuthPortal
        expiredNotice={sessionExpiredNotice}
        onAuthSuccess={(user) => {
          setCurrentUserLocal(user as User);
          setCurrentUser(user as User);
          setHasSession(true);
          setSessionExpiredNotice(null);
          setCurrentView('dashboard');
        }}
      />
    );
  }

  // Check access control
  const isAllowed = canAccessPath(currentView, currentUser.role);

  const renderContent = () => {
    if (!isAllowed) {
      return (
        <div className="py-20 flex flex-col items-center text-center gap-4 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-xl mx-auto my-12">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-display font-extrabold text-xl text-slate-900">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Your account role (<strong className="text-slate-900">{currentUser.role}</strong>) does not have authorization to access this section.
              If you believe this is incorrect, please contact your platform administrator.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => handleNavigate('dashboard')}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={handleNavigate}
            onSelectOpportunity={handleSelectOpportunity}
          />
        );

      case 'opportunities':
        return (
          <OpportunitiesView
            onSelectOpportunity={handleSelectOpportunity}
            searchQuery={searchQuery}
          />
        );

      case 'applications-tracker':
        return <ApplicationsView />;

      case 'networking':
        return <NetworkingView />;

      case 'profile':
        return <ProfileView />;

      case '1-on-1-mentorship':
        return <MentorshipView />;

      case 'learning-hub':
        return <LearningView />;

      case 'ai-career-coach-ats-reviewer':
        return <AICoachView />;

      case 'community-discussions':
        return <CommunityView />;

      case 'startups-co-founder-matching':
        return <StartupsView />;

      case 'events-webinars':
        return <EventsView />;

      case 'messages':
        return <MessagesView />;

      case 'super-admin':
        return <SuperAdminView />;

      case 'admin-portal':
        return <AdminPortalView />;

      case 'role-based-portals':
        return <PortalsView onNavigate={handleNavigate} />;


      case 'settings-rbac-permissions':
        return <SettingsView />;

      default:
        return (
          <DashboardView
            onNavigate={handleNavigate}
            onSelectOpportunity={handleSelectOpportunity}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Offline/Dev Mode Banner */}
      {isOfflineMode && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white text-center text-xs py-1.5 px-4 flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" />
          <span>Running in <strong>offline mode</strong> — Google Sheets not configured. Data is stored locally. <a href="/.env.example" className="underline">Setup guide →</a></span>
        </div>
      )}
      {/* Sticky Top Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAuthModal={() => {}}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Structural Layout */}
      <div className="flex-1 flex pt-16">
        {/* Desktop Fixed Sidebar & Mobile Drawer */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Primary Page Canvas */}
        <main className="flex-1 lg:pl-72 w-full min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6">
            <Suspense fallback={<PageLoader />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Floating Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
}
