import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Upload,
  Trash2,
  KeyRound,
  RefreshCw,
  Building,
  Award,
  Globe,
  HelpCircle,
  LogIn,
  UserPlus,
  Compass,
} from 'lucide-react';
import { UserRole, User } from '../../types';
import {
  PUBLIC_SIGNUP_ROLES,
  PRIVILEGED_ROLES,
  DEFAULT_AVATAR,
  loginWithCredentials,
  processMultiStepSignup,
  requestPasswordReset,
  completePasswordReset,
  MultiStepSignupData,
  checkRateLimit,
} from '../../lib/auth';
import { authApi } from '../../lib/api';

interface AuthPortalProps {
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup';
  expiredNotice?: string | null;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onAuthSuccess,
  initialMode = 'login',
  expiredNotice,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [signupStep, setSignupStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lockoutWait, setLockoutWait] = useState<number | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetCode, setResetCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [simulatedResetCode, setSimulatedResetCode] = useState<string | null>(null);

  // Multi-Step Signup State
  const [signupData, setSignupData] = useState<MultiStepSignupData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: 'Pakistan',
    city: 'Lahore',
    termsAccepted: false,
    role: 'Student',
    avatar: '',
    title: '',
    bio: '',
    dob: '',
    gender: '',
    institution: '',
    degree: '',
    field: '',
    startYear: '2022',
    endYear: '2026',
    grade: '',
    skills: ['Communication', 'Teamwork'],
    skillItems: [
      { name: 'Communication', level: 'Intermediate' },
      { name: 'Teamwork', level: 'Intermediate' },
    ],
    careerInterests: ['Software Engineering', 'Emerging Tech'],
    careerGoals: '',
    desiredJob: '',
    preferredIndustry: 'Information Technology',
  });

  // Avatar Upload State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification Code on Step 6
  const [verificationInputCode, setVerificationInputCode] = useState<string>('');
  const [simulatedVerifyCode, setSimulatedVerifyCode] = useState<string>('849201');

  // Quick Persona Accordion — REMOVED for security: public users must not bypass auth
  // const [showPersonaDrawer, setShowPersonaDrawer] = useState<boolean>(false);

  // Lockout Countdown Timer
  useEffect(() => {
    if (lockoutWait === null || lockoutWait <= 0) return;
    const timer = setInterval(() => {
      setLockoutWait((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutWait]);

  // Evaluate Password Strength (0 to 4)
  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(signupData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'];

  // Handle Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // Validate size (< 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setAvatarError('File is too large. Profile photo must be less than 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setSignupData((prev) => ({ ...prev, avatar: result }));
    };
    reader.onerror = () => {
      setAvatarError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    setSignupData((prev) => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ----------------------------------------------------
  // Handle Login Submit
  // ----------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      // Try API first (Google Sheets backend)
      const apiResult = await authApi.login(loginEmail, loginPassword, rememberMe);

      if (!apiResult.offline) {
        // Server responded
        if (!apiResult.success) {
          if ((apiResult as any).isLocked) setLockoutWait((apiResult as any).waitSeconds);
          setErrorMessage(apiResult.message || 'Invalid email or password.');
          return;
        }
        if (apiResult.user) {
          setSuccessMessage('Authentication verified. Welcome back to Upliftra Network!');
          setTimeout(() => { onAuthSuccess(apiResult.user as User); }, 500);
        }
      } else {
        // Handle offline state
        setErrorMessage('Login is currently unavailable. System is offline or Google Sheets backend is not configured.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handle Multi-Step Signup Navigation & Submit
  // ----------------------------------------------------
  const handleNextStep = () => {
    setErrorMessage(null);

    // Step 1 Validation
    if (signupStep === 1) {
      if (!signupData.name.trim()) {
        setErrorMessage('Please provide your full legal or professional name.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signupData.email)) {
        setErrorMessage('Please provide a valid, deliverable email address.');
        return;
      }
      if (signupData.password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      if (signupData.password !== signupData.confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify both fields.');
        return;
      }
      if (!signupData.termsAccepted) {
        setErrorMessage('You must accept the Upliftra Network Terms of Service and Privacy Policy.');
        return;
      }
      setSignupStep(2);
      return;
    }

    // Step 2 Validation (Role)
    if (signupStep === 2) {
      if (PRIVILEGED_ROLES.includes(signupData.role)) {
        setErrorMessage('Super Admin, Admin, and Moderator roles cannot be chosen during public signup.');
        return;
      }
      setSignupStep(3);
      return;
    }

    // Step 3 Validation (Basic Profile)
    if (signupStep === 3) {
      setSignupStep(4);
      return;
    }

    // Step 4 Validation (Education - skippable)
    if (signupStep === 4) {
      setSignupStep(5);
      return;
    }

    // Step 5 Validation (Skills - skippable)
    if (signupStep === 5) {
      // Generate simulated verification code for step 6
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedVerifyCode(code);
      setVerificationInputCode(code); // Pre-fill for seamless demonstration
      setSignupStep(6);
      return;
    }
  };

  const handleCompleteSignup = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      // Try API first (Google Sheets backend)
      const apiResult = await authApi.register({
        ...signupData,
        terms: signupData.termsAccepted,
        skills: signupData.skills || [],
        careerGoals: signupData.careerGoals || '',
        institution: signupData.education?.[0]?.institution || '',
      });

      if (!apiResult.offline) {
        if (!apiResult.success) {
          setErrorMessage(apiResult.message || 'Failed to complete registration.');
          return;
        }
        if (apiResult.user) {
          setSuccessMessage('Account successfully created and authenticated! Entering network...');
          setTimeout(() => { onAuthSuccess(apiResult.user as User); }, 600);
        }
      } else if (apiResult.offline) {
        setErrorMessage('Registration is currently unavailable. System is offline or Google Sheets backend is not configured.');
        return;
      }

    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during account provisioning.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handle Forgot Password
  // ----------------------------------------------------
  const handleRequestResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetEmail.trim()) {
      setErrorMessage('Please provide the email associated with your account.');
      return;
    }

    const res = requestPasswordReset(resetEmail);
    if (res.code) {
      setSimulatedResetCode(res.code);
      setResetCode(res.code); // Pre-fill for ease of testing
    }
    setSuccessMessage(res.message);
    setResetStep('verify');
  };

  const handlePerformReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetCode.trim() || !newPassword) {
      setErrorMessage('Please enter the 6-digit verification code and your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await completePasswordReset(resetEmail, resetCode, newPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Password reset failed.');
        return;
      }

      setSuccessMessage('Password reset successfully! You may now sign in with your new password.');
      setTimeout(() => {
        setLoginEmail(resetEmail);
        setLoginPassword('');
        setMode('login');
        setResetStep('request');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // handleQuickPersonaLogin REMOVED — public auth bypass is a security violation.
  // Previously allowed instant access to any role including Admin/Super Admin without credentials.

  return (
    <div id="upliftra_auth_portal" className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-950/50">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Upliftra Network
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
          Pakistan's Verified Ecosystem for Careers, Mentorship & Grants
        </p>
      </div>

      {/* Main Card Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0 z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Expiration Notice Banner */}
          {expiredNotice && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Session Security Notice</p>
                <p>{expiredNotice}</p>
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-red-200 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Authentication Alert</p>
                <p>{errorMessage}</p>
                {lockoutWait && (
                  <p className="mt-1 font-mono font-bold text-red-400">
                    Lockout timer: {Math.floor(lockoutWait / 60)}m {lockoutWait % 60}s
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3 text-emerald-200 text-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">Success</p>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* Top Mode Selector Tabs (Sign In vs Create Account) */}
          {mode !== 'forgot_password' && (
            <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl mb-6 border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  mode === 'login'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  mode === 'signup'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New Account</span>
              </button>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW 1: SIGN IN MODE */}
          {/* ==================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. yourname@university.edu.pk"
                    disabled={lockoutWait !== null}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setResetEmail(loginEmail);
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your secret password"
                    disabled={lockoutWait !== null}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Remember me for 7 days (Secure Token)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || lockoutWait !== null}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Cryptographic Credentials...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-slate-700/60 text-center">
                <p className="text-xs text-slate-400">
                  Don't have an Upliftra Network account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage(null);
                    }}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Register as Member
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ==================================================== */}
          {/* VIEW 2: MULTI-STEP SIGNUP MODE (Steps 1 to 6) */}
          {/* ==================================================== */}
          {mode === 'signup' && (
            <div>
              {/* Stepper Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400">
                    Step {signupStep} of 6:{' '}
                    {signupStep === 1 && 'Account Credentials'}
                    {signupStep === 2 && 'Role Selection'}
                    {signupStep === 3 && 'Basic Profile & Photo'}
                    {signupStep === 4 && 'Education (Optional)'}
                    {signupStep === 5 && 'Skills & Goals (Optional)'}
                    {signupStep === 6 && 'Verification & Finish'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {Math.round((signupStep / 6) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${(signupStep / 6) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step 1: Account Info */}
              {signupStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Legal or Professional Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        autoComplete="name"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        placeholder="e.g. Fatima Ali"
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        autoComplete="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        placeholder="fatima.ali@nust.edu.pk"
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password (Min 8 chars) *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Password Strength Meter */}
                      {signupData.password && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-full flex-1 transition-all ${
                                  passwordStrength >= step ? strengthColors[passwordStrength] : 'bg-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {strengthLabels[passwordStrength]}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={signupData.phone}
                          onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          placeholder="+92 300 1234567"
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        City
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={signupData.city}
                          onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
                          placeholder="Lahore / Karachi"
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Country
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={signupData.country}
                          onChange={(e) => setSignupData({ ...signupData, country: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={signupData.termsAccepted}
                        onChange={(e) => setSignupData({ ...signupData, termsAccepted: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-300 leading-relaxed">
                        I agree to the <span className="text-emerald-400 underline">Terms of Service</span>,{' '}
                        <span className="text-emerald-400 underline">Privacy Policy</span>, and verified participation guidelines of Upliftra Network Pakistan.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Role Selection */}
              {signupStep === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Select your primary participation role. This determines your ecosystem permissions and dashboard features:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {PUBLIC_SIGNUP_ROLES.map((r) => {
                      const isSelected = signupData.role === r.role;
                      return (
                        <button
                          key={r.role}
                          type="button"
                          onClick={() => setSignupData({ ...signupData, role: r.role })}
                          className={`p-3 rounded-xl text-left border transition flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-emerald-600/20 border-emerald-500 text-white'
                              : 'bg-slate-900/60 border-slate-700/70 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                            {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold">{r.label}</div>
                            <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{r.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Security Notice: Privileged Roles Lockout */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 text-[11px] text-amber-300/90 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Privileged Roles Protected:</span> Administrative accounts (Super Admin, Admin, Moderator) require verified institutional appointment and cannot be self-selected during public registration.
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Basic Profile & Photo */}
              {signupStep === 3 && (
                <div className="space-y-4">
                  {/* Photo Upload Area */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Profile Photo (Optional - Defaults to clean ecosystem avatar)
                    </label>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-700/80">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/50 bg-slate-800 shrink-0">
                        <img
                          src={avatarPreview || signupData.avatar || DEFAULT_AVATAR}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handlePhotoSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Photo</span>
                          </button>

                          {(avatarPreview || signupData.avatar) && (
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          PNG, JPG, or WebP. Max file size: 3 MB.
                        </p>
                        {avatarError && (
                          <p className="text-[11px] text-red-400 font-semibold">{avatarError}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Professional Headline / Title
                    </label>
                    <input
                      type="text"
                      value={signupData.title}
                      onChange={(e) => setSignupData({ ...signupData, title: e.target.value })}
                      placeholder={`e.g. ${signupData.role} @ FAST / Aspiring AI Engineer`}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Short Bio / Summary
                    </label>
                    <textarea
                      rows={2}
                      value={signupData.bio}
                      onChange={(e) => setSignupData({ ...signupData, bio: e.target.value })}
                      placeholder="Share a brief introduction of your career goals or expertise..."
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Date of Birth (Optional)
                      </label>
                      <input
                        type="date"
                        value={signupData.dob}
                        onChange={(e) => setSignupData({ ...signupData, dob: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Gender (Optional)
                      </label>
                      <select
                        value={signupData.gender}
                        onChange={(e) => setSignupData({ ...signupData, gender: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Education (Optional / Skippable) */}
              {signupStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-300 font-semibold">
                      Education Credentials (Optional — You may complete this later)
                    </p>
                    <button
                      type="button"
                      onClick={() => setSignupStep(5)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                    >
                      Skip Step →
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      University or Institution
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={signupData.institution}
                        onChange={(e) => setSignupData({ ...signupData, institution: e.target.value })}
                        placeholder="e.g. NUST / FAST / LUMS / NED"
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Degree Program
                      </label>
                      <input
                        type="text"
                        value={signupData.degree}
                        onChange={(e) => setSignupData({ ...signupData, degree: e.target.value })}
                        placeholder="e.g. BS Computer Science"
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Major / Field of Study
                      </label>
                      <input
                        type="text"
                        value={signupData.field}
                        onChange={(e) => setSignupData({ ...signupData, field: e.target.value })}
                        placeholder="e.g. Software Engineering / AI"
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Start Year
                      </label>
                      <input
                        type="text"
                        value={signupData.startYear}
                        onChange={(e) => setSignupData({ ...signupData, startYear: e.target.value })}
                        placeholder="2022"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Graduation Year
                      </label>
                      <input
                        type="text"
                        value={signupData.endYear}
                        onChange={(e) => setSignupData({ ...signupData, endYear: e.target.value })}
                        placeholder="2026"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        CGPA / Grade
                      </label>
                      <input
                        type="text"
                        value={signupData.grade}
                        onChange={(e) => setSignupData({ ...signupData, grade: e.target.value })}
                        placeholder="3.8 / 4.0"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Skills & Career (Optional / Skippable) */}
              {signupStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-300 font-semibold">
                      Skills & Industry Aspirations (Optional)
                    </p>
                    <button
                      type="button"
                      onClick={() => handleNextStep()}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                    >
                      Skip Step →
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Key Technical & Professional Skills
                    </label>
                    <input
                      type="text"
                      defaultValue="React, TypeScript, Python, Communication"
                      onChange={(e) => {
                        const skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setSignupData({
                          ...signupData,
                          skills,
                          skillItems: skills.map((s) => ({ name: s, level: 'Intermediate' })),
                        });
                      }}
                      placeholder="Comma separated: React, Python, UI/UX, Cloud"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Career Goal or Desired Role
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={signupData.careerGoals}
                        onChange={(e) => setSignupData({ ...signupData, careerGoals: e.target.value })}
                        placeholder="e.g. Securing a Software Engineering Internship in Pakistan or Remote"
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Industry Sector
                    </label>
                    <select
                      value={signupData.preferredIndustry}
                      onChange={(e) => setSignupData({ ...signupData, preferredIndustry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Information Technology">Information Technology & Software</option>
                      <option value="Artificial Intelligence">Artificial Intelligence & Data Science</option>
                      <option value="Fintech & Banking">Fintech & Digital Banking</option>
                      <option value="Healthtech">Healthtech & Biomedical</option>
                      <option value="Edtech">Edtech & Higher Learning</option>
                      <option value="E-Commerce & Startups">E-Commerce & Venture Startups</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 6: Finish & Account Activation */}
              {signupStep === 6 && (
                <div className="space-y-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Almost Ready! Verify & Activate Your Account
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    We've simulated sending a 6-digit security code to{' '}
                    <span className="font-semibold text-emerald-300">{signupData.email}</span>.
                  </p>

                  <div className="max-w-xs mx-auto">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Enter 6-Digit Email Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationInputCode}
                      onChange={(e) => setVerificationInputCode(e.target.value)}
                      placeholder="849201"
                      className="w-full text-center tracking-widest font-mono text-lg font-bold py-2.5 bg-slate-900 border border-emerald-500/50 rounded-xl text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      (Pre-filled for seamless testing: {simulatedVerifyCode})
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-left text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Role:</span>
                      <span className="font-bold text-emerald-400">{signupData.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profile Name:</span>
                      <span className="font-bold text-white">{signupData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-slate-200">{signupData.city}, {signupData.country}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Signup Multi-Step Bottom Controls */}
              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between gap-3">
                {signupStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setSignupStep(signupStep - 1)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Already have an account? Sign in
                  </button>
                )}

                {signupStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="ml-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
                  >
                    <span>Continue to Step {signupStep + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCompleteSignup}
                    className="ml-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Provisioning Account & Hashing Credentials...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Activate My Account & Enter Network</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW 3: FORGOT PASSWORD FLOW */}
          {/* ==================================================== */}
          {mode === 'forgot_password' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Reset Account Password</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your email address to receive a 6-digit cryptographic password reset code.
                </p>
              </div>

              {resetStep === 'request' ? (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="yourname@domain.edu.pk"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ← Back to Login
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <span>Send 6-Digit Reset Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePerformReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="e.g. 582194"
                      className="w-full text-center font-mono tracking-widest text-lg font-bold py-2 bg-slate-900 border border-slate-700 rounded-xl text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {simulatedResetCode && (
                      <p className="text-[11px] text-emerald-400 mt-1 text-center">
                        Code dispatched: {simulatedResetCode} (Valid for 15 mins)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      New Strong Password (Min 8 characters)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep('request')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ← Change Email
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Update Password & Return</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Security Architecture Statement */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>WebCrypto SHA-256 with 16-byte Salt • Session Expiry Active • RBAC Enforced • Brute-Force Protection</span>
          </p>
        </div>
      </div>
    </div>
  );
};
