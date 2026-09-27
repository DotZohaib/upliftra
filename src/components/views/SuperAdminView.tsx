import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Key,
  Database,
  FileSpreadsheet,
  Activity,
  Settings,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  Save,
  X,
  Crown,
  UserCheck,
  Sliders,
  Clock,
} from 'lucide-react';
import {
  User,
  UserRole,
  AuditLog,
  SystemSettings,
  FeatureFlags,
  RolePermission,
} from '../../types';
import {
  getCurrentUser,
  getUsers,
  updateUser,
  deleteUser,
  getAuditLogs,
  logAuditEvent,
  getSystemSettings,
  updateSystemSettings,
  getFeatureFlags,
  toggleFeatureFlag,
  getRolePermissions,
  updateRolePermission,
  resetDatabaseToDefaults,
  getStorageStats,
  getItem,
  setItem,
} from '../../lib/storage';
import { AUTH_STORAGE_KEYS } from '../../lib/auth';
import { isSuperAdmin, PermissionKey } from '../../lib/permissions';

type AdminTab = 'overview' | 'users' | 'roles' | 'data' | 'audit' | 'system' | 'security';

const PRIVILEGED_ROLES: UserRole[] = ['Admin', 'Super Admin', 'Moderator'];
const ALL_ROLES: UserRole[] = [
  'Student', 'Professional', 'Mentor', 'Recruiter', 'Company', 'Startup/Founder',
  'University', 'Organization', 'Volunteer', 'Campus Ambassador', 'Partner', 'Trainer',
  'Moderator', 'Admin', 'Super Admin',
];

const PERMISSION_COLUMNS: { key: PermissionKey; label: string }[] = [
  { key: 'viewOpportunities', label: 'View Opps' },
  { key: 'applyOpportunities', label: 'Apply' },
  { key: 'postOpportunities', label: 'Post Opps' },
  { key: 'requestMentorship', label: 'Req. Mentor' },
  { key: 'offerMentorship', label: 'Offer Mentor' },
  { key: 'createCourses', label: 'Courses' },
  { key: 'moderateCommunity', label: 'Moderate' },
  { key: 'managePlatformData', label: 'DB Admin' },
  { key: 'accessSuperAdmin', label: 'Super Admin' },
];

export const SuperAdminView: React.FC = () => {
  const currentAdmin = getCurrentUser();

  if (!isSuperAdmin(currentAdmin.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <Lock className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Super Admin Access Required</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          This console is exclusively accessible to <strong>Super Admin</strong> accounts.
          Unauthorized access attempts are logged in the platform audit trail.
        </p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => getSystemSettings());
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => getFeatureFlags());
  const [permissions, setPermissions] = useState<RolePermission[]>(() => getRolePermissions());
  const [storageStats, setStorageStats] = useState(() => getStorageStats());
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // User Management
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Audit Logs
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('All');

  // Security
  const [rateLimits, setRateLimits] = useState<Record<string, any>>(() =>
    getItem<Record<string, any>>(AUTH_STORAGE_KEYS.RATE_LIMITS, {})
  );

  // System Settings Form
  const [settingsForm, setSettingsForm] = useState({ ...systemSettings });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshData = () => {
    setUsers(getUsers());
    setAuditLogs(getAuditLogs());
    setPermissions(getRolePermissions());
    setStorageStats(getStorageStats());
    setRateLimits(getItem<Record<string, any>>(AUTH_STORAGE_KEYS.RATE_LIMITS, {}));
    showToast('Data refreshed.', 'info');
  };

  const audit = (action: string, target: string, description: string) => {
    logAuditEvent({
      action, userId: currentAdmin.id, userName: currentAdmin.name,
      userRole: currentAdmin.role, target, description,
    });
  };

  // User Actions
  const handleSuspendUser = (user: User) => {
    if (user.id === currentAdmin.id) { showToast('Cannot suspend your own account.', 'error'); return; }
    updateUser({ ...user, status: 'suspended', updatedAt: new Date().toISOString() });
    setUsers(getUsers());
    audit('user_suspended', user.email, `Super Admin suspended: ${user.name}`);
    showToast(`${user.name} suspended.`);
  };

  const handleActivateUser = (user: User) => {
    updateUser({ ...user, status: 'active', updatedAt: new Date().toISOString() });
    setUsers(getUsers());
    audit('user_activated', user.email, `Super Admin activated: ${user.name}`);
    showToast(`${user.name} activated.`);
  };

  const handleVerifyUser = (user: User) => {
    updateUser({ ...user, verificationStatus: 'verified', updatedAt: new Date().toISOString() });
    setUsers(getUsers());
    audit('user_verified', user.email, `Super Admin granted verified badge: ${user.name}`);
    showToast(`${user.name} is now verified ✓`);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentAdmin.id) { showToast('Cannot delete your own account.', 'error'); return; }
    if (!window.confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return;
    deleteUser(user.id);
    setUsers(getUsers());
    audit('user_deleted', user.email, `Super Admin deleted: ${user.name}`);
    showToast(`${user.name} deleted.`, 'error');
  };

  const handleAssignRole = (user: User, newRole: UserRole) => {
    if (user.id === currentAdmin.id && newRole !== 'Super Admin') {
      showToast('Cannot change your own Super Admin role.', 'error'); return;
    }
    updateUser({ ...user, role: newRole, updatedAt: new Date().toISOString() });
    setUsers(getUsers());
    audit('role_assigned', user.email, `Role changed ${user.role} → ${newRole} for: ${user.name}`);
    showToast(`${user.name} → ${newRole}`);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    updateUser({ ...editingUser, updatedAt: new Date().toISOString() });
    setUsers(getUsers());
    audit('user_profile_edited', editingUser.email, `Super Admin edited profile: ${editingUser.name}`);
    setShowEditModal(false);
    setEditingUser(null);
    showToast('User profile saved.');
  };

  // Filtered data
  const filteredUsers = users.filter((u) => {
    const matchSearch = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'All' || u.role === userRoleFilter;
    const matchStatus = userStatusFilter === 'All' || u.status === userStatusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch = !auditSearch || (log.description || '').toLowerCase().includes(auditSearch.toLowerCase()) || (log.userName || '').toLowerCase().includes(auditSearch.toLowerCase());
    const matchAction = auditActionFilter === 'All' || log.action === auditActionFilter;
    return matchSearch && matchAction;
  });

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'active').length,
    suspendedUsers: users.filter((u) => u.status === 'suspended').length,
    verifiedUsers: users.filter((u) => u.verificationStatus === 'verified').length,
    adminCount: users.filter((u) => u.role === 'Admin' || u.role === 'Super Admin').length,
    recentLogs: auditLogs.slice(0, 5),
  };

  const TAB_CONFIG: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'users', label: `Users (${users.length})`, icon: <Users className="w-4 h-4" /> },
    { id: 'roles', label: 'Roles & RBAC', icon: <Key className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <Clock className="w-4 h-4" /> },
    { id: 'system', label: 'System', icon: <Settings className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-20 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {toast.type === 'error' && <XCircle className="w-4 h-4" />}
          {toast.type === 'info' && <Activity className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Crown className="w-7 h-7 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl tracking-tight">Super Admin Console</h1>
              <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[10px] font-bold uppercase tracking-wider">
                Privileged
              </span>
            </div>
            <p className="text-purple-200 text-xs mt-0.5">
              Authorized as: <strong>{currentAdmin.name}</strong> • {currentAdmin.email}
            </p>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold border border-white/20 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh All Data
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-white rounded-2xl border border-slate-200 p-1.5">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.id ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================== */}
      {/* OVERVIEW TAB */}
      {/* =========================================================== */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Users', value: stats.totalUsers, color: 'text-slate-900', bg: 'bg-slate-50' },
              { label: 'Active', value: stats.activeUsers, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Suspended', value: stats.suspendedUsers, color: 'text-rose-700', bg: 'bg-rose-50' },
              { label: 'Verified', value: stats.verifiedUsers, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Admins', value: stats.adminCount, color: 'text-purple-700', bg: 'bg-purple-50' },
              { label: 'DB Size', value: `${storageStats.totalKb} KB`, color: 'text-amber-700', bg: 'bg-amber-50' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex flex-col gap-1 border border-slate-200/60`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
                <span className={`text-2xl font-extrabold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" /> Recent Platform Activity
            </h3>
            <div className="divide-y divide-slate-100">
              {stats.recentLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No audit events yet.</p>
              ) : (
                stats.recentLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{log.action?.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-slate-500 truncate">{log.description}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/* USERS TAB */}
      {/* =========================================================== */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full pl-9 pr-4 h-9 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-purple-300 focus:outline-none"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold"
            >
              <option value="All">All Roles</option>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending</option>
              <option value="disabled">Disabled</option>
            </select>
            <span className="text-xs text-slate-400 whitespace-nowrap self-center">{filteredUsers.length}/{users.length}</span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px] tracking-wider">User</th>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px] tracking-wider">Role</th>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px] tracking-wider">Status</th>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px] tracking-wider">Verified</th>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px] tracking-wider">Joined</th>
                    <th className="p-3 text-center font-bold text-slate-400 uppercase text-[10px] tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32'; }}
                          />
                          <div>
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-slate-400 text-[11px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleAssignRole(user, e.target.value as UserRole)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                            PRIVILEGED_ROLES.includes(user.role)
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          user.status === 'suspended' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{user.status}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.verificationStatus === 'verified' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>{user.verificationStatus}</span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">{new Date(user.createdAt).toLocaleDateString('en-PK')}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditingUser({ ...user }); setShowEditModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Edit user">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {user.verificationStatus !== 'verified' && (
                            <button onClick={() => handleVerifyUser(user)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Verify">
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {user.status === 'suspended' ? (
                            <button onClick={() => handleActivateUser(user)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Activate">
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => handleSuspendUser(user)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Suspend"
                              disabled={user.id === currentAdmin.id}>
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteUser(user)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600" title="Delete"
                            disabled={user.id === currentAdmin.id}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No users match current filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/* ROLES & RBAC TAB */}
      {/* =========================================================== */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-600" /> 15-Role Authorization Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Toggle permissions. Super Admin cannot be restricted.</p>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-50">Role</th>
                  {PERMISSION_COLUMNS.map((col) => (
                    <th key={col.key} className="p-3 text-center whitespace-nowrap">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((p) => (
                  <tr key={p.role} className={`hover:bg-slate-50 ${PRIVILEGED_ROLES.includes(p.role) ? 'bg-purple-50/30' : ''}`}>
                    <td className={`p-3 font-bold whitespace-nowrap sticky left-0 bg-white ${PRIVILEGED_ROLES.includes(p.role) ? 'text-purple-700' : 'text-slate-900'}`}>
                      {p.role}
                    </td>
                    {PERMISSION_COLUMNS.map((col) => (
                      <td key={col.key} className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(p[col.key])}
                          onChange={() => {
                            if (p.role === 'Super Admin') return;
                            const updated = { ...p, [col.key]: !p[col.key] };
                            updateRolePermission(updated);
                            setPermissions(getRolePermissions());
                            audit('permission_changed', `${p.role}:${col.key}`, `Permission ${col.key} for ${p.role} → ${!p[col.key]}`);
                          }}
                          disabled={p.role === 'Super Admin'}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/* DATA MANAGEMENT TAB */}
      {/* =========================================================== */}
      {activeTab === 'data' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Storage Statistics</h3>
                  <p className="text-[11px] text-slate-500">Client-side localStorage metrics</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total Size', value: `${storageStats.totalKb} KB` },
                  { label: 'Data Items', value: storageStats.itemsCount },
                  { label: 'Users', value: users.length },
                  { label: 'Audit Events', value: auditLogs.length },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{s.label}</p>
                    <p className="text-sm font-extrabold text-slate-800">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="font-bold text-sm text-rose-800">Danger Zone</h3>
                <p className="text-xs text-rose-600">Irreversible actions. Proceed with extreme caution.</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('DANGER: Reset ALL platform data to initial seed? This deletes ALL users, posts, applications, and messages permanently.')) {
                  resetDatabaseToDefaults();
                  audit('database_reset', 'full_database', 'Super Admin executed full database reset to seed state.');
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition w-fit"
            >
              <Trash2 className="w-4 h-4" />
              Reset Database to Seed State
            </button>
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/* AUDIT LOGS TAB */}
      {/* =========================================================== */}
      {activeTab === 'audit' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-9 pr-4 h-9 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-purple-300 focus:outline-none"
              />
            </div>
            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold"
            >
              <option value="All">All Actions</option>
              {[...new Set(auditLogs.map((l) => l.action).filter(Boolean))].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400 self-center">{filteredLogs.length} events</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px]">Timestamp</th>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px]">Action</th>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px]">Performed By</th>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px]">Target</th>
                    <th className="p-3 text-left font-bold text-slate-400 uppercase text-[10px]">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.slice(0, 100).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400 whitespace-nowrap font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleString('en-PK')}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] whitespace-nowrap">
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">{log.userName || log.userId || '—'}</td>
                      <td className="p-3 text-slate-500 max-w-[150px] truncate">{log.target || '—'}</td>
                      <td className="p-3 text-slate-500 max-w-[250px] truncate">{log.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLogs.length === 0 && (
              <div className="py-12 text-center">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No audit events match filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/* SYSTEM SETTINGS TAB */}
      {/* =========================================================== */}
      {activeTab === 'system' && (
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-600" /> Platform Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['platformName', 'tagline', 'contactEmail'] as const).map((key) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type="text"
                    value={String(settingsForm[key] ?? '')}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-purple-300 focus:outline-none"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Allow Public Registration</label>
                <label className="flex items-center gap-2 cursor-pointer mt-1.5">
                  <input
                    type="checkbox"
                    checked={settingsForm.allowRegistration}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, allowRegistration: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-xs text-slate-600">Enabled</span>
                </label>
              </div>
            </div>
            <button
              onClick={() => {
                updateSystemSettings(settingsForm);
                audit('system_settings_updated', 'system_settings', 'Super Admin updated platform system configuration.');
                showToast('Platform settings saved.');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition w-fit"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" /> Feature Flags
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.entries(featureFlags) as [keyof FeatureFlags, boolean][]).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <button
                    onClick={() => {
                      toggleFeatureFlag(key);
                      setFeatureFlags(getFeatureFlags());
                      audit('feature_flag_toggled', key, `Feature "${key}" → ${!value}`);
                    }}
                    className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-purple-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/* SECURITY TAB */}
      {/* =========================================================== */}
      {activeTab === 'security' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600" /> Brute-Force Lockout Records
            </h3>
            <p className="text-xs text-slate-500">Accounts locked after 5 consecutive failed logins. Auto-expires after 15 minutes.</p>
            {Object.keys(rateLimits).length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No active lockouts. Security is clean.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(rateLimits).map(([email, lock]: [string, any]) => (
                  <div key={email} className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-rose-800">{email}</p>
                      <p className="text-[11px] text-rose-600">
                        {lock.failedAttempts} failed attempts
                        {lock.lockedUntil && ` • Locked until ${new Date(lock.lockedUntil).toLocaleTimeString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const current = getItem<Record<string, any>>(AUTH_STORAGE_KEYS.RATE_LIMITS, {});
                        delete current[email];
                        setItem(AUTH_STORAGE_KEYS.RATE_LIMITS, current);
                        setRateLimits({ ...current });
                        audit('lockout_cleared', email, `Manually cleared brute-force lockout: ${email}`);
                        showToast(`Lockout cleared for ${email}`);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold"
                    >
                      <Unlock className="w-3 h-3" /> Clear Lock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Security Architecture Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Password Hashing', value: 'WebCrypto SHA-256 + 16-byte salt + pepper', ok: true },
                { label: 'Session Management', value: '24hr standard / 7-day remember-me with expiry', ok: true },
                { label: 'Brute-Force Protection', value: '5 attempts → 15-minute lockout per email', ok: true },
                { label: 'Privilege Escalation Block', value: 'Enforced at signup & role assignment', ok: true },
                { label: 'RBAC Enforcement', value: 'Path-level + action-level checks', ok: true },
                { label: 'Backend Auth Server', value: 'Frontend-only (client localStorage) — upgrade recommended', ok: false },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  {item.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-700">{item.label}</p>
                    <p className="text-[11px] text-slate-500">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/* EDIT USER MODAL */}
      {/* =========================================================== */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Edit: {editingUser.name}</h3>
              <button onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {([
                { label: 'Full Name', field: 'name', type: 'text' },
                { label: 'Email Address', field: 'email', type: 'email' },
                { label: 'Title / Headline', field: 'title', type: 'text' },
                { label: 'Location', field: 'location', type: 'text' },
                { label: 'Phone', field: 'phone', type: 'tel' },
              ] as const).map(({ label, field, type }) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">{label}</label>
                  <input
                    type={type}
                    value={String(editingUser[field as keyof User] || '')}
                    onChange={(e) => setEditingUser((prev) => prev ? { ...prev, [field]: e.target.value } : null)}
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-purple-300 focus:outline-none"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Bio</label>
                <textarea rows={3}
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser((prev) => prev ? { ...prev, bio: e.target.value } : null)}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-purple-300 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Account Status</label>
                  <select value={editingUser.status}
                    onChange={(e) => setEditingUser((prev) => prev ? { ...prev, status: e.target.value as User['status'] } : null)}
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="disabled">Disabled</option>
                    <option value="pending_verification">Pending Verification</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Verification</label>
                  <select value={editingUser.verificationStatus}
                    onChange={(e) => setEditingUser((prev) => prev ? { ...prev, verificationStatus: e.target.value as User['verificationStatus'] } : null)}
                    className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <option value="unverified">Unverified</option>
                    <option value="in-review">In Review</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200">
              <button onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">
                Cancel
              </button>
              <button onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
