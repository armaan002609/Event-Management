'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Shield,
  ShieldCheck,
  RefreshCw,
  User as UserIcon,
  LogIn,
  KeyRound,
  Check,
  ChevronRight,
  School,
  AlertTriangle,
} from 'lucide-react';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import confetti from 'canvas-confetti';

interface DemoUserItem {
  id: string;
  name: string;
  email: string;
  gender: string;
  role: string;
  emailVerified: boolean;
  college?: { code: string; name: string; color: string } | null;
}

function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState<'signin' | 'presets' | 'register'>('signin');
  const [demoUsers, setDemoUsers] = useState<DemoUserItem[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(true);

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('unifest123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeHint, setCodeHint] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [regRole, setRegRole] = useState<'STUDENT' | 'MANAGER'>('STUDENT');
  const [regCollege, setRegCollege] = useState('col-pce');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.demoUsers) {
          setDemoUsers(data.demoUsers);
        }
        setLoadingDemo(false);
      })
      .catch(() => setLoadingDemo(false));
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Standard Email & Password Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.warning('Missing Credentials', 'Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Welcome Back!', `Logged in as ${data.user?.name || 'User'}`);
        router.push('/');
        router.refresh();
      } else if (data.error === 'EMAIL_NOT_VERIFIED') {
        // Trigger Email Verification flow!
        toast.warning('Email Verification Required', data.message || 'Please verify your email to continue.');
        setVerifyEmail(data.email || email.trim());
        setCodeHint(data.codeHint || '749215');
        setVerificationCode(data.codeHint || '');
        setIsVerifying(true);
      } else {
        toast.error('Sign In Failed', data.error || 'Invalid credentials');
      }
    } catch {
      toast.error('Network Error', 'Could not connect to authentication server');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Email Verification Code submission
  const handleVerifyCode = async (codeToSubmit?: string) => {
    const code = (codeToSubmit || verificationCode).trim();
    if (!code) {
      toast.warning('Code Required', 'Please enter your 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Email Verified! 🎉', data.message || 'Your email address is now verified.');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3B3FD9', '#10B981', '#F59E0B', '#8B5CF6'],
        });
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 800);
      } else {
        toast.error('Verification Failed', data.message || data.error || 'Invalid verification code.');
      }
    } catch {
      toast.error('Network Error', 'Could not verify email code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Verification Code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.info('Code Dispatched', data.message || 'A new code has been generated.');
        if (data.codeHint) {
          setCodeHint(data.codeHint);
          setVerificationCode(data.codeHint);
        }
        setResendCooldown(30);
      } else {
        toast.error('Resend Failed', data.error || 'Could not resend code');
      }
    } catch {
      toast.error('Network Error', 'Failed to request new code');
    } finally {
      setIsResending(false);
    }
  };

  // Handle New Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      toast.warning('Missing Fields', 'Please fill in your name, email, and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          gender: regGender,
          role: regRole,
          collegeId: regCollege,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Account Created', 'Please verify your email address with the code provided.');
        setVerifyEmail(data.email);
        setCodeHint(data.codeHint);
        setVerificationCode(data.codeHint || '');
        setIsVerifying(true);
      } else {
        toast.error('Registration Failed', data.error || 'Could not create account');
      }
    } catch {
      toast.error('Network Error', 'Registration service unavailable');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Demo Login
  const handlePresetLogin = async (user: DemoUserItem) => {
    if (!user.emailVerified) {
      // Direct user into verification showcase
      setVerifyEmail(user.email);
      setCodeHint('749215');
      setVerificationCode('749215');
      setIsVerifying(true);
      toast.warning('Account Not Verified', `${user.name}'s email is unverified. Please complete verification.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        toast.success('Logged In', `Entering portal as ${user.name} (${user.role})`);
        router.push('/');
        router.refresh();
      } else {
        toast.error('Preset Failed', 'Could not activate selected profile');
      }
    } catch {
      toast.error('Network Error', 'Could not sign in with demo preset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      {/* Decorative ambient blurred orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-xl text-white tracking-tight">
                Uni<span className="text-indigo-400">Fest</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-300 border border-white/10 backdrop-blur-sm">
                2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Sports & Folk Festival Portal
            </p>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          Explore Portal as Guest →
        </Link>
      </header>

      {/* Central Card */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-8">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-slate-900 transition-all">
          {/* ══════════ EMAIL VERIFICATION SCREEN ══════════ */}
          {isVerifying ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <ShieldCheck className="w-7 h-7 text-amber-600" />
                </div>
                <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Verify Your Email
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  To protect hostel and meal allocations, an email verification code is required.
                </p>
                <div className="inline-block mt-1">
                  <span className="text-xs font-bold text-primary bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    {verifyEmail}
                  </span>
                </div>
              </div>

              {/* Code Hint Banner for Instant Testing */}
              {codeHint && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="text-[11px] text-emerald-900">
                      <span className="font-bold">Demo Verification Code:</span>{' '}
                      <span className="font-mono font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                        {codeHint}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationCode(codeHint);
                      toast.info('Code Pasted', `Inserted code ${codeHint}`);
                    }}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Paste
                  </button>
                </div>
              )}

              {/* Verification Code Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Enter 6-Digit Verification Code:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 749215"
                    className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 rounded-2xl border-2 border-indigo-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting || verificationCode.length < 4}
                  onClick={() => handleVerifyCode()}
                  className="w-full py-3.5 rounded-2xl bg-primary text-white font-heading font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify & Enter Portal</span>
                    </>
                  )}
                </button>

                {/* Instant 1-Click Verify Shortcut */}
                <button
                  type="button"
                  onClick={() => handleVerifyCode('123456')}
                  className="w-full py-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant 1-Click Verification (Demo Bypass)</span>
                </button>
              </div>

              {/* Resend & Back controls */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifying(false);
                    setCodeHint(null);
                  }}
                  className="hover:text-slate-800 font-semibold"
                >
                  ← Back to Sign In
                </button>

                <button
                  type="button"
                  disabled={isResending || resendCooldown > 0}
                  onClick={handleResendCode}
                  className="text-primary font-bold hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          ) : (
            /* ══════════ NORMAL LOGIN / PRESETS / REGISTER ══════════ */
            <div>
              {/* Header Title */}
              <div className="text-center mb-6">
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  Welcome to UniFest
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Unified identity authentication for students, staff, and operations managers.
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl mb-6 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    tab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('presets')}
                  className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    tab === 'presets' ? 'bg-white text-primary shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Role Presets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>

              {/* TAB 1: SIGN IN FORM */}
              {tab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="aarav.sharma@pce.edu"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => setPassword('unifest123')}
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        Use Demo Password
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>Remember session</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Password: unifest123</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-primary text-white font-heading font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">
                      Want fast 1-click role testing?{' '}
                      <button
                        type="button"
                        onClick={() => setTab('presets')}
                        className="text-primary font-bold hover:underline"
                      >
                        Browse Role Presets
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* TAB 2: QUICK ROLE PRESETS (1-CLICK DEMO ACCESS) */}
              {tab === 'presets' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 mb-2">
                    Click any persona below for instant 1-click authentication:
                  </p>

                  {loadingDemo ? (
                    <div className="text-center py-6">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Loading demo profiles...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {demoUsers.map((u) => {
                        const isUnverified = !u.emailVerified;
                        return (
                          <div
                            key={u.id}
                            onClick={() => handlePresetLogin(u)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isUnverified
                                ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
                                : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs font-bold flex items-center justify-center text-sm shrink-0">
                                {u.role === 'STUDENT' ? '🎓' : u.role === 'MANAGER' ? '👔' : u.role === 'SCANNER' ? '📱' : '🛡️'}
                              </span>
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-heading font-bold text-xs text-slate-900 truncate">
                                    {u.name}
                                  </span>
                                  {isUnverified ? (
                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-md shrink-0">
                                      Unverified
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md shrink-0">
                                      Verified
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100">
                                {u.role}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-auto mt-1" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3 text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-primary flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Email Verification Showcase:
                    </p>
                    <p>
                      Click <strong>Sneha Patel</strong> above to test the verification gate. You will be prompted for code <code>749215</code> to activate her account.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: REGISTER NEW ACCOUNT */}
              {tab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Arjun Kapoor"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="arjun.kapoor@college.edu"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Role</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="MANAGER">Event Manager</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Gender</label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                      >
                        <option value="MALE">Male (♂)</option>
                        <option value="FEMALE">Female (♀)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">College / Institution</label>
                    <select
                      value={regCollege}
                      onChange={(e) => setRegCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                    >
                      <option value="col-pce">Punjab College of Engineering (PCE)</option>
                      <option value="col-lpu">Lovely Professional University (LPU)</option>
                      <option value="col-du">Delhi University (DU)</option>
                      <option value="col-iitd">IIT Delhi (IITD)</option>
                      <option value="col-bits">BITS Pilani (BITS)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-primary text-white font-heading font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Create Account & Verify</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl w-full mx-auto text-center py-4 text-xs text-slate-400">
        <p>UniFest Operations 2026 · Role-based access control with email verification</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ToastProvider>
      <LoginForm />
    </ToastProvider>
  );
}
