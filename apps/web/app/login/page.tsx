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
  ShieldCheck,
  RefreshCw,
  User as UserIcon,
  LogIn,
  Check,
  School,
} from 'lucide-react';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import confetti from 'canvas-confetti';
import { getBrowserSupabaseClient } from '@/lib/supabase';

function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState<'signin' | 'register'>('signin');

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Email Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeNotification, setCodeNotification] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [regRole, setRegRole] = useState<'STUDENT' | 'MANAGER'>('STUDENT');
  const [regCollege, setRegCollege] = useState('col-pce');

  // Countdown timer for resend code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle URL errors such as account_not_found from Google OAuth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    const errEmail = params.get('email');
    const errName = params.get('name');

    if (err === 'account_not_found') {
      setTab('register');
      if (errEmail) setRegEmail(errEmail);
      if (errName) setRegName(errName);
      toast.warning(
        'Account Required',
        'No account found with this Google email. Please create your account first, then you can log in with Google!'
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle Google OAuth Sign In via Supabase
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const sb = getBrowserSupabaseClient();
      if (!sb) {
        toast.error('Config Error', 'Supabase configuration is missing in environment.');
        setIsGoogleLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        toast.error('Google Sign-In Failed', error.message);
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      toast.error('Error', err?.message || 'Could not connect to Google authentication.');
      setIsGoogleLoading(false);
    }
  };

  // Handle Standard Email & Password Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.warning('Missing Credentials', 'Please enter your email and password.');
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
        toast.warning('Email Verification Required', data.message || 'Please verify your email address to continue.');
        setVerifyEmail(data.email || email.trim());
        setCodeNotification(data.codeHint || null);
        setIsVerifying(true);
      } else {
        toast.error('Sign In Failed', data.error || 'Invalid email or password.');
      }
    } catch {
      toast.error('Network Error', 'Could not connect to authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Email Verification Code submission
  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = verificationCode.trim();
    if (!code) {
      toast.warning('Code Required', 'Please enter the 6-digit verification code.');
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
        toast.info('Code Resent', data.message || 'A new verification code has been dispatched.');
        if (data.codeHint) setCodeNotification(data.codeHint);
        setResendCooldown(30);
      } else {
        toast.error('Resend Failed', data.error || 'Could not resend code');
      }
    } catch {
      toast.error('Network Error', 'Failed to request new verification code');
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
        toast.success('Account Created', 'Please verify your email address with the verification code.');
        setVerifyEmail(data.email);
        setCodeNotification(data.codeHint || null);
        setVerificationCode('');
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
      </header>

      {/* Central Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-8">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 text-slate-900 transition-all">
          {/* ══════════ EMAIL VERIFICATION SCREEN ══════════ */}
          {isVerifying ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-primary flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Verify Your Email
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  A 6-digit verification code has been dispatched to your email address.
                </p>
                <div className="inline-block mt-1">
                  <span className="text-xs font-bold text-primary bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    {verifyEmail}
                  </span>
                </div>
              </div>

              {/* Simulation Dispatch Alert (Informs user of code in local environment) */}
              {codeNotification && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-blue-900">
                    <span className="font-bold">Verification Code:</span>{' '}
                    <span className="font-mono font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300">
                      {codeNotification}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationCode(codeNotification);
                      toast.info('Code Inserted', `Code ${codeNotification} applied.`);
                    }}
                    className="text-[10px] font-bold text-blue-800 bg-blue-200/80 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* Verification Code Form */}
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Enter 6-Digit Verification Code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 rounded-2xl border-2 border-indigo-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || verificationCode.length < 4}
                  className="w-full py-3.5 rounded-2xl bg-primary text-white font-heading font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify Email & Continue</span>
                    </>
                  )}
                </button>
              </form>

              {/* Resend & Back controls */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifying(false);
                    setCodeNotification(null);
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
            /* ══════════ NORMAL LOGIN / REGISTER ══════════ */
            <div>
              {/* Header Title */}
              <div className="text-center mb-5">
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  {tab === 'signin' ? 'Sign In to UniFest' : 'Create an Account'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {tab === 'signin'
                    ? 'Enter your credentials to access the festival portal.'
                    : 'Register your student or staff profile with email verification.'}
                </p>
              </div>

              {/* Google OAuth Quick Button */}
              <div className="space-y-4 mb-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 disabled:opacity-60 group active:scale-[0.99]"
                >
                  {isGoogleLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-white/95 px-3 text-slate-400 font-bold">Or continue with credentials</span>
                  </div>
                </div>
              </div>

              {/* Mode Tabs (Sign In / Sign Up) */}
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
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@college.edu"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
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
                      Don&apos;t have an account yet?{' '}
                      <button
                        type="button"
                        onClick={() => setTab('register')}
                        className="text-primary font-bold hover:underline"
                      >
                        Create an account
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* TAB 2: REGISTER NEW ACCOUNT */}
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

                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setTab('signin')}
                        className="text-primary font-bold hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl w-full mx-auto text-center py-4 text-xs text-slate-400">
        <p>UniFest Operations 2026 · Secure authentication with email verification</p>
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
