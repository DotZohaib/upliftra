import React, { useState } from 'react';
import {
  X,
  Lock,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  User as UserIcon,
  Mail,
  MapPin,
  Phone,
  Calendar,
  Building,
  Briefcase,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import {
  getUsers,
  signupUser,
  loginUser,
  setCurrentUser,
  switchUserByRole,
} from '../../lib/storage';
import { loginWithCredentials, processMultiStepSignup } from '../../lib/auth';
import { SEED_USERS } from '../../data/seedData';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

// Public roles allowed during self-signup
const PUBLIC_ALLOWED_ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: 'Student', label: 'Student', desc: 'Higher ed student looking for internships, jobs & scholarships' },
  { role: 'Professional', label: 'Professional', desc: 'Working tech professional expanding career & network' },
  { role: 'Mentor', label: 'Mentor', desc: 'Industry veteran guiding young Pakistani talent' },
  { role: 'Recruiter', label: 'Recruiter', desc: 'HR / Talent scout hiring top engineering candidates' },
  { role: 'Company', label: 'Company', desc: 'Enterprise or corporate posting opportunities' },
  { role: 'Startup/Founder', label: 'Startup / Founder', desc: 'Early-stage tech founder seeking hires & co-founders' },
  { role: 'University', label: 'University', desc: 'Academic institution / Placement office' },
  { role: 'Organization', label: 'Organization', desc: 'NGO, development fund or youth association' },
  { role: 'Volunteer', label: 'Volunteer', desc: 'Community contributor giving back to tech' },
  { role: 'Campus Ambassador', label: 'Campus Ambassador', desc: 'University student leader representing Upliftra' },
  { role: 'Partner', label: 'Partner', desc: 'Sponsorship or ecosystem bilateral partner' },
  { role: 'Trainer', label: 'Trainer', desc: 'Course author teaching bootcamps & skills' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'personas'>('form');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [city, setCity] = useState('Lahore');
  const [country, setCountry] = useState('Pakistan');
  const [phone, setPhone] = useState('+92 300 ');
  const [dob, setDob] = useState('2002-01-15');
  const [avatar, setAvatar] = useState('');
  const [accountType, setAccountType] = useState<'individual' | 'organization'>('individual');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickLogin = (seedUser: User) => {
    const user = switchUserByRole(seedUser.role);
    onSuccess(user);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
    } catch {
      // Ignore confetti errors
    }
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    const res = await loginWithCredentials(email, password, rememberMe);
    if (!res.success || !res.user) {
      setError(res.error || 'Authentication failed. Please check your credentials.');
      return;
    }

    setSuccessMsg(`Welcome back, ${res.user.name}!`);
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch {
      // Ignore confetti errors
    }
    setTimeout(() => {
      onSuccess(res.user!);
      onClose();
    }, 400);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const res = await processMultiStepSignup({
      name,
      email,
      password,
      confirmPassword,
      role,
      country,
      city,
      phone,
      dob,
      avatar,
      termsAccepted,
      title: `${role} on Upliftra Network`,
      bio: '',
      institution: '',
      degree: '',
      field: '',
      startYear: '',
      endYear: '',
      grade: '',
      skills: ['Networking'],
      skillItems: [{ name: 'Networking', level: 'Intermediate' }],
      careerInterests: [],
      careerGoals: '',
    });

    if (!res.success || !res.user) {
      setError(res.error || 'Registration failed. Please check the form.');
      return;
    }

    setSuccessMsg(`Welcome to Upliftra Network, ${res.user.name}!`);
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {
      // Ignore confetti errors
    }
    setTimeout(() => {
      onSuccess(res.user!);
      onClose();
    }, 500);
  };

  return (
    <div
      id="auth_modal_overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="auth_modal_container"
        className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold shadow-md shadow-emerald-700/20">
              UN
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? 'Log in to Upliftra Network' : 'Create an Upliftra Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pakistan’s premier career and opportunity ecosystem
              </p>
            </div>
          </div>
          <button
            id="auth_modal_close_button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switchers: Form vs 1-Click Personas */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 py-2 dark:border-slate-800 dark:bg-slate-900/50 shrink-0">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                  mode === 'login'
                    ? 'bg-white text-emerald-800 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                  mode === 'register'
                    ? 'bg-white text-emerald-800 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Sign Up
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'personas' ? 'form' : 'personas')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {activeTab === 'personas' ? 'Back to Form' : '15 Quick Demo Roles'}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* Modal Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {activeTab === 'personas' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Instant Access Personas (1-Click Test Login)
                </span>
                <span className="text-[11px] text-slate-500">Includes all 15 RBAC roles</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SEED_USERS.map((su) => (
                  <button
                    key={su.id}
                    type="button"
                    onClick={() => handleQuickLogin(su)}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 text-left transition hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-slate-800 dark:hover:border-emerald-500/50 dark:hover:bg-slate-800/80 group"
                  >
                    <img
                      src={su.avatar}
                      alt={su.name}
                      className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {su.name}
                        </span>
                        <span
                          className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold ${
                            su.role === 'Super Admin' || su.role === 'Admin'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : su.role === 'Moderator'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {su.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{su.title}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 shrink-0 transition" />
                  </button>
                ))}
              </div>
            </div>
          ) : mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="login_email_input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ayesha.khan@student.nust.edu.pk"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="login_password_input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('ayesha.khan@student.nust.edu.pk');
                    setPassword('password123');
                  }}
                  className="text-emerald-700 hover:underline font-medium dark:text-emerald-400"
                >
                  Fill Sample Credentials
                </button>
              </div>

              <button
                id="login_submit_button"
                type="submit"
                className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800 transition"
              >
                Sign In to Account
              </button>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                Don’t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Register here
                </button>
              </div>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="signup_name_input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Zohaib Tariq"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="signup_email_input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="zohaib.tariq@gmail.com"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password (min 6 chars) *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="signup_password_input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="signup_confirm_password_input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role Selection (Authorized Public Roles Only) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Select Your Role *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Admin/Super Admin require authorized promotion
                  </span>
                </div>
                <select
                  id="signup_role_select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {PUBLIC_ALLOWED_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* City, Country, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lahore / Karachi"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 0000000"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Account Type & Profile Photo URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Type
                  </label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="accountType"
                        value="individual"
                        checked={accountType === 'individual'}
                        onChange={() => setAccountType('individual')}
                        className="text-emerald-600"
                      />
                      Individual
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="accountType"
                        value="organization"
                        checked={accountType === 'organization'}
                        onChange={() => setAccountType('organization')}
                        className="text-emerald-600"
                      />
                      Organization / University
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    id="signup_terms_checkbox"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I agree to the Upliftra Network Pakistan{' '}
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">Terms of Service</span> and{' '}
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              <button
                id="signup_submit_button"
                type="submit"
                className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800 transition"
              >
                Create My Account & Open Dashboard
              </button>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Log in here
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info note */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Client-Side Local Storage Auth & RBAC
          </span>
          <span>Version 2.4 PK</span>
        </div>
      </div>
    </div>
  );
};
