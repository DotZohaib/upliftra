import React, { useState } from 'react';
import {
  Settings,
  UserCheck,
  ShieldCheck,
  Save,
  Check,
  CheckCircle2,
  Lock,
  Database,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  Mail,
  KeyRound,
  Globe,
  Bell,
  AlertTriangle,
  LogOut,
  Laptop,
} from 'lucide-react';
import { User, RolePermission, UserRole, PrivacySettings } from '../../types';
import {
  getCurrentUser,
  updateUser,
  getRolePermissions,
  updateRolePermission,
  resetDatabaseToDefaults,
} from '../../lib/storage';
import { PermissionKey, isAdmin } from '../../lib/permissions';
import { getActiveSession, invalidateSession, verifyUserPassword, updateUserPassword } from '../../lib/auth';
import confetti from 'canvas-confetti';

export const SettingsView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(getCurrentUser());
  const [permissions, setPermissions] = useState<RolePermission[]>(getRolePermissions());
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'rbac' | 'system'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [privacySaveSuccess, setPrivacySaveSuccess] = useState(false);

  // Profile Form State
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [title, setTitle] = useState(currentUser.title);
  const [institution, setInstitution] = useState(currentUser.institution || '');
  const [location, setLocation] = useState(currentUser.location);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [skillsStr, setSkillsStr] = useState(currentUser.skills.join(', '));
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [linkedin, setLinkedin] = useState(currentUser.linkedin || '');
  const [github, setGithub] = useState(currentUser.github || '');
  const [website, setWebsite] = useState(currentUser.website || '');

  // Privacy Settings State
  const defaultPrivacy: PrivacySettings = {
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showActivityStatus: true,
    allowDirectMessages: 'everyone',
    searchEngineIndexing: true,
  };
  const [privacy, setPrivacy] = useState<PrivacySettings>(
    currentUser.privacySettings || defaultPrivacy
  );

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Session info
  const activeSessionInfo = getActiveSession();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...currentUser,
      name,
      email,
      title,
      institution,
      location,
      bio,
      phone,
      linkedin,
      github,
      website,
      skills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
    };
    updateUser(updated);
    setCurrentUser(updated);
    setSaveSuccess(true);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
    } catch {
      // safe
    }
    setTimeout(() => setSaveSuccess(false), 2500);
    window.dispatchEvent(new Event('upliftra_data_changed'));
  };

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...currentUser,
      privacySettings: privacy,
    };
    updateUser(updated);
    setCurrentUser(updated);
    setPrivacySaveSuccess(true);
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
    } catch {
      // safe
    }
    setTimeout(() => setPrivacySaveSuccess(false), 2500);
    window.dispatchEvent(new Event('upliftra_data_changed'));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const isCurrentValid = await verifyUserPassword(currentUser.id, currentPassword);
      if (!isCurrentValid) {
        setPasswordError('Current password verification failed. Please check your credentials.');
        setIsChangingPassword(false);
        return;
      }

      await updateUserPassword(currentUser.id, newPassword);

      setPasswordSuccess('Your password has been changed securely. Please use the new password next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTogglePermission = (role: UserRole, key: PermissionKey) => {
    const rolePerm = permissions.find((p) => p.role === role);
    if (!rolePerm) return;

    const updated = {
      ...rolePerm,
      [key]: !rolePerm[key],
    };
    updateRolePermission(updated);
    setPermissions(getRolePermissions());
  };

  const permissionColumns: { key: PermissionKey; label: string }[] = [
    { key: 'viewOpportunities', label: 'View Opps' },
    { key: 'applyOpportunities', label: 'Apply' },
    { key: 'postOpportunities', label: 'Post Opps' },
    { key: 'requestMentorship', label: 'Req Mentorship' },
    { key: 'offerMentorship', label: 'Offer Mentor' },
    { key: 'createCourses', label: 'Create Course' },
    { key: 'moderateCommunity', label: 'Moderate' },
    { key: 'managePlatformData', label: 'Excel/DB Admin' },
    { key: 'accessSuperAdmin', label: 'Super Admin' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            Settings & Privacy Controls
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage your personal profile, privacy visibility, password security, and active session controls.
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'profile' ? 'bg-white text-[#047857] shadow-xs' : 'text-slate-600'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'privacy' ? 'bg-white text-[#047857] shadow-xs' : 'text-slate-600'
            }`}
          >
            Privacy & Security
          </button>
          {isAdmin(currentUser.role) && (
            <>
              <button
                onClick={() => setActiveTab('rbac')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'rbac' ? 'bg-white text-[#047857] shadow-xs' : 'text-slate-600'
                }`}
              >
                RBAC Matrix (15 Roles)
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'system' ? 'bg-white text-[#047857] shadow-xs' : 'text-slate-600'
                }`}
              >
                Local Storage DB
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: Profile */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-5 max-w-3xl"
        >
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20"
            />
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">{currentUser.name}</h3>
              <span className="text-xs text-[#047857] font-semibold">{currentUser.role}</span>
              <span className="text-[11px] text-slate-400 block">{currentUser.location}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Headline / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Institution / Alma Mater</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Phone Number (Optional)</label>
              <input
                type="text"
                value={phone}
                placeholder="+92 300 1234567"
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Location (City, Pakistan)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">LinkedIn URL</label>
              <input
                type="url"
                value={linkedin}
                placeholder="https://linkedin.com/in/username"
                onChange={(e) => setLinkedin(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Skills (comma separated)</label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Professional Bio</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {saveSuccess ? (
              <span className="text-xs text-[#047857] font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Profile updated successfully!</span>
              </span>
            ) : (
              <span></span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Privacy & Security */}
      {activeTab === 'privacy' && (
        <div className="flex flex-col gap-6 max-w-3xl">
          {/* Privacy Visibility Preferences */}
          <form
            onSubmit={handleSavePrivacy}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-5"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Profile & Contact Visibility
                </h3>
                <p className="text-xs text-slate-500">
                  Control who can see your contact information, credentials, and career milestones.
                </p>
              </div>
            </div>

            {/* Profile Visibility Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">Profile Visibility Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPrivacy({ ...privacy, profileVisibility: 'public' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    privacy.profileVisibility === 'public'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Public</span>
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] text-slate-500 leading-snug">
                    Visible to all visitors, recruiters, and educational partners.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacy({ ...privacy, profileVisibility: 'network' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    privacy.profileVisibility === 'network'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Network Only</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] text-slate-500 leading-snug">
                    Only verified members signed in to Upliftra Network can view.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacy({ ...privacy, profileVisibility: 'private' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    privacy.profileVisibility === 'private'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Private</span>
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] text-slate-500 leading-snug">
                    Hidden from search. Only companies you apply to directly can view.
                  </span>
                </button>
              </div>
            </div>

            {/* Granular switches */}
            <div className="flex flex-col divide-y divide-slate-100 pt-2">
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Display Email to Mentors & Employers</span>
                    <span className="text-[11px] text-slate-500">Allow verified mentors and employers to view your email directly.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.showEmail}
                  onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                  className="w-4 h-4 text-[#047857] rounded focus:ring-[#047857] cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Display Phone Number</span>
                    <span className="text-[11px] text-slate-500">Allow corporate recruiters to contact via telephone for interview scheduling.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.showPhone}
                  onChange={(e) => setPrivacy({ ...privacy, showPhone: e.target.checked })}
                  className="w-4 h-4 text-[#047857] rounded focus:ring-[#047857] cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Show Online Activity Status</span>
                    <span className="text-[11px] text-slate-500">Show a green activity badge when you are actively on the platform.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.showActivityStatus}
                  onChange={(e) => setPrivacy({ ...privacy, showActivityStatus: e.target.checked })}
                  className="w-4 h-4 text-[#047857] rounded focus:ring-[#047857] cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Allow Search Engine Indexing</span>
                    <span className="text-[11px] text-slate-500">Index public portfolio on Google for Pakistani talent discovery.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.searchEngineIndexing}
                  onChange={(e) => setPrivacy({ ...privacy, searchEngineIndexing: e.target.checked })}
                  className="w-4 h-4 text-[#047857] rounded focus:ring-[#047857] cursor-pointer"
                />
              </div>
            </div>

            {/* Direct Messaging Permissions */}
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">Who Can Send You Direct Messages</label>
              <select
                value={privacy.allowDirectMessages}
                onChange={(e) => setPrivacy({ ...privacy, allowDirectMessages: e.target.value as any })}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              >
                <option value="everyone">Everyone on Upliftra Network</option>
                <option value="verified_only">Verified Members, Mentors & Recruiters Only</option>
                <option value="connections_only">Accepted Connections Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {privacySaveSuccess ? (
                <span className="text-xs text-[#047857] font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Privacy settings saved!</span>
                </span>
              ) : (
                <span></span>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Privacy Settings</span>
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form
            onSubmit={handleChangePassword}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Update Account Password
                </h3>
                <p className="text-xs text-slate-500">
                  Passwords are cryptographic SHA-256 hashed with salt. Never stored in plain-text.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">New Password (8+ chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isChangingPassword ? 'Securing...' : 'Update Password'}</span>
              </button>
            </div>
          </form>

          {/* Active Session Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Active Session & Devices
                  </h3>
                  <p className="text-xs text-slate-500">
                    Current authenticated session token and browser fingerprint.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Active Now
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Session ID:</span>
                <code className="text-slate-800 font-mono text-[11px] font-bold">
                  {activeSessionInfo.session?.sessionId || 'active_session_client'}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Expires At:</span>
                <span className="text-slate-800 font-semibold">
                  {activeSessionInfo.session?.expiresAt
                    ? new Date(activeSessionInfo.session.expiresAt).toLocaleString()
                    : 'Session Valid'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Authentication Method:</span>
                <span className="text-emerald-700 font-bold">WebCrypto SHA-256 Client-Side Token</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Logging out revokes your active token and prevents back-navigation.
              </span>
              <button
                type="button"
                onClick={() => invalidateSession(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out This Device</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC Matrix (Admin & Super Admin only) */}
      {activeTab === 'rbac' && isAdmin(currentUser.role) && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                15-Role Authorization Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Centralized frontend permissions dataset loaded from <code>upliftra_permissions</code>. Toggles apply immediately to the active session.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="p-3">Role</th>
                  {permissionColumns.map((col) => (
                    <th key={col.key} className="p-3 text-center">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((p) => (
                  <tr key={p.role} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{p.role}</td>
                    {permissionColumns.map((col) => (
                      <td key={col.key} className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(p[col.key])}
                          onChange={() => handleTogglePermission(p.role, col.key)}
                          className="w-4 h-4 text-[#047857] rounded focus:ring-[#047857] cursor-pointer"
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

      {/* TAB 4: Local Storage DB (Admin & Super Admin only) */}
      {activeTab === 'system' && isAdmin(currentUser.role) && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-4 max-w-2xl">
          <h3 className="font-display font-bold text-base text-slate-900">
            Local Storage Runtime Diagnostics
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Upliftra Network frontend operates entirely on client-side storage, with schema-validated tables for users, opportunities, applications, mentorship slots, and AI message history.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Application Mode:</span>
              <span className="font-bold text-[#047857]">Frontend-Only (No Server DB)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Offline Resilience:</span>
              <span className="font-bold text-emerald-800">100% Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Excel Interop Engine:</span>
              <span className="font-bold text-slate-800">SheetJS (.xlsx)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (window.confirm('Reset local database to initial seed dataset?')) {
                  resetDatabaseToDefaults();
                  window.location.reload();
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset to Clean Seed State</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
