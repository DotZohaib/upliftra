import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  Settings,
  Database,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Check,
  Star,
  Lock,
  Sliders,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  User,
  UserRole,
  Opportunity,
  VerificationRequest,
  CommunityReport,
  AuditLog,
  SystemSettings,
  FeatureFlags,
} from '../../types';
import {
  getCurrentUser,
  getUsers,
  updateUser,
  deleteUser,
  getOpportunities,
  approveOpportunity,
  rejectOpportunity,
  toggleFeatureOpportunity,
  deleteOpportunity,
  getVerificationRequests,
  approveVerificationRequest,
  rejectVerificationRequest,
  getCommunityReports,
  resolveCommunityReport,
  deleteCommunityPost,
  getAuditLogs,
  logAuditEvent,

  getSystemSettings,
  updateSystemSettings,
  getFeatureFlags,
  toggleFeatureFlag,
  getStorageStats,
  resetDatabaseToDefaults,
} from '../../lib/storage';
import { ROLE_PERMISSIONS, isSuperAdmin, isAdmin } from '../../lib/permissions';
import confetti from 'canvas-confetti';

export const AdminPortalView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'opportunities' | 'verifications' | 'reports' | 'system' | 'audit'
  >('overview');

  // Datasets
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => getOpportunities());
  const [verifications, setVerifications] = useState<VerificationRequest[]>(() => getVerificationRequests());
  const [reports, setReports] = useState<CommunityReport[]>(() => getCommunityReports());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => getSystemSettings());
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => getFeatureFlags());
  const [storageStats, setStorageStats] = useState(() => getStorageStats());

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [oppSearch, setOppSearch] = useState('');
  const [oppStatusFilter, setOppStatusFilter] = useState('All');
  const [auditActionFilter, setAuditActionFilter] = useState('All');

  // UI Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isSuper = isSuperAdmin(currentUser.role);
  const isAdm = isAdmin(currentUser.role) || isSuper;

  useEffect(() => {
    const handleStorageChange = () => {
      setUsers(getUsers());
      setOpportunities(getOpportunities());
      setVerifications(getVerificationRequests());
      setReports(getCommunityReports());
      setAuditLogs(getAuditLogs());
      setSystemSettings(getSystemSettings());
      setFeatureFlags(getFeatureFlags());
      setStorageStats(getStorageStats());
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('upliftra_data_changed', handleStorageChange);
    return () => window.removeEventListener('upliftra_data_changed', handleStorageChange);
  }, []);

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchQuery =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.location && u.location.toLowerCase().includes(userSearch.toLowerCase()));
    const matchRole = userRoleFilter === 'All' || u.role === userRoleFilter;
    return matchQuery && matchRole;
  });

  const filteredOpportunities = opportunities.filter((o) => {
    const matchQuery =
      o.title.toLowerCase().includes(oppSearch.toLowerCase()) ||
      o.company.toLowerCase().includes(oppSearch.toLowerCase()) ||
      o.location.toLowerCase().includes(oppSearch.toLowerCase());
    const matchStatus =
      oppStatusFilter === 'All' ||
      (oppStatusFilter === 'Featured' ? o.featured : o.type === oppStatusFilter);
    return matchQuery && matchStatus;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter === 'All') return true;
    return log.action.toLowerCase().includes(auditActionFilter.toLowerCase());
  });

  // User Actions
  const handleRoleChange = (targetUserId: string, newRole: UserRole) => {
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) return;
    updateUser({ ...targetUser, role: newRole });
    logAuditEvent('Role Changed', `Admin updated ${targetUser.name}'s role to ${newRole}`);
    showToast(`Role updated to ${newRole}`);
  };

  const handleToggleUserStatus = (targetUser: User) => {
    const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    updateUser({ ...targetUser, status: newStatus });
    logAuditEvent('User Status Changed', `Admin changed ${targetUser.name} status to ${newStatus}`);
    showToast(`User ${targetUser.name} is now ${newStatus}`);
  };

  const handleDeleteUser = (targetUserId: string, targetName: string) => {
    if (confirm(`Are you sure you want to delete user "${targetName}"?`)) {
      deleteUser(targetUserId);
      logAuditEvent('User Deleted', `Admin deleted user ${targetName}`);
      showToast(`User ${targetName} deleted`);
    }
  };

  // Opportunity Actions
  const handleApproveOpp = (oppId: string, title: string) => {
    approveOpportunity(oppId);
    showToast(`Approved opportunity: "${title}"`);
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch {}
  };

  const handleRejectOpp = (oppId: string, title: string) => {
    rejectOpportunity(oppId);
    showToast(`Rejected opportunity: "${title}"`);
  };

  const handleToggleFeature = (oppId: string) => {
    toggleFeatureOpportunity(oppId);
    showToast(`Updated featured status`);
  };

  const handleDeleteOpp = (oppId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteOpportunity(oppId);
      showToast(`Deleted "${title}"`);
    }
  };

  // Verification Actions
  const handleApproveVerification = (reqId: string, entityName: string) => {
    approveVerificationRequest(reqId);
    showToast(`Approved verification for ${entityName}`);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
    } catch {}
  };

  const handleRejectVerification = (reqId: string, entityName: string) => {
    rejectVerificationRequest(reqId);
    showToast(`Rejected verification for ${entityName}`);
  };

  // Report Actions
  const handleDismissReport = (repId: string) => {
    resolveCommunityReport(repId, 'dismissed');
    showToast(`Report dismissed`);
  };

  const handleActionOnReport = (rep: CommunityReport) => {
    deleteCommunityPost(rep.postId);
    resolveCommunityReport(rep.id, 'action_taken');
    showToast(`Post deleted and report marked action taken`);
  };

  // Feature Flag toggle
  const handleToggleFlag = (key: keyof FeatureFlags) => {
    toggleFeatureFlag(key);
    showToast(`Updated feature flag: ${String(key)}`);
  };

  // System settings update
  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(systemSettings);
    showToast(`System platform settings saved successfully!`);
  };

  return (
    <div id="admin_portal_container" className="flex flex-col gap-6 w-full pb-20 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          <Check className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {currentUser.role === 'Super Admin' ? 'Super Admin Command Console' : 'Platform Administration'}
              </span>
              <span className="text-xs text-emerald-200/80">RBAC Enforcement Active</span>
            </div>
            <h1 className="text-2xl font-bold font-display">Upliftra Governance & Management Portal</h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Monitor national platform metrics, moderate Pakistani users & opportunities, inspect institutional verifications, audit logs, and toggle runtime feature flags.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Reset entire platform database back to initial seed data?')) {
                  resetDatabaseToDefaults();
                  showToast('Database reset to defaults.');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/80 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Seeds
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Analytics & Overview', icon: Activity },
          { id: 'users', label: `Users (${users.length})`, icon: Users },
          { id: 'opportunities', label: `Opportunities (${opportunities.length})`, icon: Briefcase },
          { id: 'verifications', label: `Verifications (${verifications.filter((v) => v.status === 'pending').length})`, icon: ShieldCheck },
          { id: 'reports', label: `Flagged Reports (${reports.filter((r) => r.status === 'pending').length})`, icon: AlertTriangle },
          ...(isSuper ? [
            { id: 'system', label: 'System & Feature Flags', icon: Sliders },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: Clock },
          ] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Total Users</span>
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{users.length}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">15 active personas</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Opportunities</span>
                <Briefcase className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{opportunities.length}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">Jobs, Internships & Grants</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Pending Verifications</span>
                <ShieldCheck className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {verifications.filter((v) => v.status === 'pending').length}
              </div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Requires review</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Local DB Storage</span>
                <Database className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{storageStats.totalKb} KB</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">{storageStats.itemsCount} tables synced</div>
            </div>
          </div>

          {/* Breakdown Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Opportunities Breakdown */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Opportunity Distribution by Type</span>
                <span className="text-xs text-slate-400 font-normal">Active Catalog</span>
              </h3>
              <div className="space-y-3">
                {['Job', 'Internship', 'Scholarship', 'Fellowship', 'Competition'].map((type) => {
                  const count = opportunities.filter((o) => o.type === type).length;
                  const pct = Math.round((count / (opportunities.length || 1)) * 100);
                  return (
                    <div key={type} className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span className="font-medium">{type}s</span>
                        <span className="font-bold">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Admin Actions & Platform Status */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Platform System Status</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Frontend Environment</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Zero-Backend / Local Storage</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Role-Based Access Control</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">15 Roles Enforced</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Audit Trail Logging</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Operational ({auditLogs.length} events)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Manage Users →
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name, email, or city..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
            >
              <option value="All">All Roles (15)</option>
              {Object.keys(ROLE_PERMISSIONS).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Current Role</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          {Object.keys(ROLE_PERMISSIONS).map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {u.location || 'Pakistan'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            u.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {u.status === 'suspended' ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            title={u.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              u.status === 'suspended'
                                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950'
                                : 'text-amber-700 bg-amber-50 dark:bg-amber-950'
                            }`}
                          >
                            {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            title="Delete user record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPPORTUNITIES MANAGEMENT */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={oppSearch}
                onChange={(e) => setOppSearch(e.target.value)}
                placeholder="Search opportunities by title, company, or city..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <select
              value={oppStatusFilter}
              onChange={(e) => setOppStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
            >
              <option value="All">All Types</option>
              <option value="Job">Job</option>
              <option value="Internship">Internship</option>
              <option value="Scholarship">Scholarship</option>
              <option value="Fellowship">Fellowship</option>
              <option value="Competition">Competition</option>
              <option value="Featured">Featured Only</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Opportunity</th>
                    <th className="p-3.5">Company / Org</th>
                    <th className="p-3.5">Type & Level</th>
                    <th className="p-3.5">Featured</th>
                    <th className="p-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredOpportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{opp.title}</div>
                        <div className="text-[11px] text-slate-400">{opp.location} • {opp.stipendOrSalary}</div>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                        {opp.company}
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {opp.type} • {opp.experienceLevel}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleFeature(opp.id)}
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            opp.featured
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}
                        >
                          <Star className={`h-3 w-3 ${opp.featured ? 'fill-amber-400' : ''}`} />
                          {opp.featured ? 'Featured' : 'Standard'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveOpp(opp.id, opp.title)}
                            title="Approve opportunity"
                            className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectOpp(opp.id, opp.title)}
                            title="Reject / Unpublish"
                            className="rounded-lg bg-rose-50 dark:bg-rose-950 p-1.5 text-rose-700 dark:text-rose-400 hover:bg-rose-100"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOpp(opp.id, opp.title)}
                            title="Delete"
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VERIFICATION REQUESTS */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          {verifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No pending verification requests</h3>
              <p className="text-xs text-slate-500 mt-1">Companies and academic institutions requesting verified badges will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifications.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        {req.entityType.toUpperCase()} VERIFICATION
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{req.entityName}</h4>
                      <p className="text-xs text-slate-500">Contact: {req.contactEmail}</p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs space-y-1">
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>SECP / Registration No:</strong> {req.registrationNumber}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Official Document:</strong> {req.documentProof}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Requested on: {req.requestDate}
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleRejectVerification(req.id, req.entityName)}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveVerification(req.id, req.entityName)}
                        className="rounded-xl bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                      >
                        Grant Verified Status
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: FLAGGED COMMUNITY REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Clean moderation queue</h3>
              <p className="text-xs text-slate-500 mt-1">No community posts or opportunity listings are currently flagged.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-rose-100 dark:bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                        {rep.reason}
                      </span>
                      <span className="text-xs text-slate-500">
                        Reported by: <strong>{rep.reporterName}</strong> ({rep.createdAt})
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                      "{rep.postSnippet}"
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Author: {rep.postAuthor} • Status: <strong className="uppercase">{rep.status}</strong>
                    </span>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDismissReport(rep.id)}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleActionOnReport(rep)}
                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Remove Post
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SYSTEM CONFIGURATION & FEATURE FLAGS (Super Admin Only) */}
      {activeTab === 'system' && isSuper && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Flags Toggle */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              Runtime Feature Modules
            </h3>
            <p className="text-xs text-slate-500">
              Enable or disable specific platform modules across Upliftra in real time.
            </p>

            <div className="space-y-3">
              {(Object.keys(featureFlags) as Array<keyof FeatureFlags>).map((key) => {
                const isEnabled = featureFlags[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isEnabled ? 'Available to all users' : 'Temporarily suspended'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFlag(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Settings Form */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="h-4 w-4 text-emerald-600" />
              Platform Branding & Defaults
            </h3>

            <form onSubmit={handleSaveSystemSettings} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={systemSettings.platformName}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, platformName: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Platform Tagline
                </label>
                <input
                  type="text"
                  value={systemSettings.tagline}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, tagline: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={systemSettings.contactEmail}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, contactEmail: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Allow Public User Registration
                </span>
                <input
                  type="checkbox"
                  checked={systemSettings.allowRegistration}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, allowRegistration: e.target.checked })
                  }
                  className="h-4 w-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition shadow-xs"
                >
                  Save Platform Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS (Super Admin Only) */}
      {activeTab === 'audit' && isSuper && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="All">All Actions</option>
                <option value="User">User Events</option>
                <option value="Opportunity">Opportunity Events</option>
                <option value="Role">Role Changes</option>
                <option value="Login">Login Events</option>
              </select>
            </div>


          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Actor (User)</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{log.action}</td>
                      <td className="p-3.5 text-emerald-700 dark:text-emerald-400 font-medium">
                        {log.userName} ({log.userRole})
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
