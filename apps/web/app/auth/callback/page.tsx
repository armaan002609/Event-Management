'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getBrowserSupabaseClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      const sb = getBrowserSupabaseClient();
      if (!sb) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Supabase is not configured on this environment.');
        }
        return;
      }

      try {
        // Check if Supabase returned an OAuth error in query or hash
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash);
          const errDesc = searchParams.get('error_description') || hashParams.get('error_description');
          if (errDesc) {
            setStatus('error');
            const cleanErr = decodeURIComponent(errDesc.replace(/\+/g, ' '));
            if (cleanErr.includes('Unable to exchange external code')) {
              setErrorMessage('Google rejected the Client Secret in Supabase. Please verify the Client Secret in Supabase Dashboard.');
            } else {
              setErrorMessage(cleanErr);
            }
            return;
          }
        }

        // Wait for session or auth state to resolve
        const { data: { session }, error: sessionError } = await sb.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user?.email) {
          await processUser(session.user);
          return;
        }

        // Listen for auth state change if session isn't immediately populated from hash
        const { data: authListener } = sb.auth.onAuthStateChange(async (event, session) => {
          if (session?.user?.email) {
            authListener.subscription.unsubscribe();
            await processUser(session.user);
          }
        });

        // Timeout fallback after 8 seconds
        setTimeout(() => {
          if (isMounted && status === 'loading') {
            setStatus('error');
            setErrorMessage('Google authentication timed out. Please try logging in again.');
          }
        }, 8000);
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err?.message || 'Authentication error occurred.');
        }
      }
    }

    async function processUser(user: any) {
      try {
        const email = user.email;
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email.split('@')[0];
        let intent = 'signin';
        if (typeof window !== 'undefined') {
          const storedIntent = sessionStorage.getItem('unifest_google_oauth_intent');
          const urlIntent = new URLSearchParams(window.location.search).get('intent');
          intent = storedIntent || urlIntent || 'signin';
          sessionStorage.removeItem('unifest_google_oauth_intent');
        }

        const res = await fetch('/api/auth/oauth-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, intent }),
        });

        const resData = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (resData.error === 'ACCOUNT_NOT_FOUND') {
            router.push(`/login?error=account_not_found&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name || '')}`);
            return;
          }
          throw new Error(resData.message || resData.error || 'Failed to initialize session');
        }

        if (isMounted) {
          setStatus('success');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 600);
        }
      } catch (e: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(e.message || 'Session setup failed');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-white/20">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-6 h-6 text-primary" />
        </div>

        {status === 'loading' && (
          <div className="space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
            <h2 className="font-heading font-black text-xl text-slate-900">
              Verifying Google Account...
            </h2>
            <p className="text-xs text-slate-500">
              Finalizing your festival credentials and security profile.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
            <h2 className="font-heading font-black text-xl text-slate-900">
              Welcome to UniFest!
            </h2>
            <p className="text-xs text-slate-500">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h2 className="font-heading font-black text-xl text-slate-900">
              Sign-In Incomplete
            </h2>
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {errorMessage || 'Could not complete Google authentication.'}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
