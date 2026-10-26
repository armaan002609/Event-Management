'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';
import { getBrowserSupabaseClient } from '@/lib/supabase';

// 10 minutes inactivity timeout (600,000 ms)
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
// Show warning at 9 minutes (60 seconds before logout)
const WARNING_BEFORE_LOGOUT_MS = 60 * 1000;
// Throttle activity event recording to avoid CPU overhead
const ACTIVITY_THROTTLE_MS = 2500;
const STORAGE_KEY = 'unifest_last_activity_timestamp';

export function InactivityGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const lastRecordedRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef(false);

  // Skip inactivity guard on unauthenticated / public pages
  const isPublicPage = pathname === '/login' || pathname.startsWith('/auth/');

  // Check if user is authenticated
  useEffect(() => {
    if (isPublicPage) {
      setIsAuthenticated(false);
      setShowWarning(false);
      return;
    }

    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.user) {
          setIsAuthenticated(true);
          const now = Date.now();
          lastRecordedRef.current = now;
          try {
            localStorage.setItem(STORAGE_KEY, String(now));
          } catch {}
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsAuthenticated(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname, isPublicPage]);

  // Logout handler
  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setShowWarning(false);

    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('unifest_last_activity_timestamp');
      // Sign out from Supabase client if connected
      const sb = getBrowserSupabaseClient();
      if (sb) {
        sb.auth.signOut().catch(() => {});
      }
      // Clear server session cookie
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      router.push('/login?reason=inactivity');
      router.refresh();
    }
  }, [router]);

  // Keep alive / reset activity
  const resetActivity = useCallback(() => {
    const now = Date.now();
    lastRecordedRef.current = now;
    setShowWarning(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {}
  }, []);

  // Track user interactions (mousemove, mousedown, keydown, scroll, touchstart, click)
  useEffect(() => {
    if (!isAuthenticated || isPublicPage) return;

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle state and storage updates to every 2.5 seconds
      if (now - lastRecordedRef.current >= ACTIVITY_THROTTLE_MS) {
        lastRecordedRef.current = now;
        try {
          localStorage.setItem(STORAGE_KEY, String(now));
        } catch {}
        if (showWarning) {
          setShowWarning(false);
        }
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel', 'click'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Cross-tab synchronization: if active in another tab, update here too
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = Number(e.newValue);
        if (!isNaN(remoteTime) && remoteTime > lastRecordedRef.current) {
          lastRecordedRef.current = remoteTime;
          setShowWarning(false);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, isPublicPage, showWarning]);

  // Periodic idle check timer (checks every 1 second)
  useEffect(() => {
    if (!isAuthenticated || isPublicPage) return;

    const interval = setInterval(() => {
      // Read the most recent timestamp (either from ref or synced localStorage)
      let lastActive = lastRecordedRef.current;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = Number(stored);
          if (!isNaN(parsed) && parsed > lastActive) {
            lastActive = parsed;
            lastRecordedRef.current = parsed;
          }
        }
      } catch {}

      const now = Date.now();
      const elapsed = now - lastActive;
      const timeLeft = INACTIVITY_TIMEOUT_MS - elapsed;

      if (timeLeft <= 0) {
        // 10 minutes exceeded with zero activity -> Log out!
        clearInterval(interval);
        performLogout();
      } else if (timeLeft <= WARNING_BEFORE_LOGOUT_MS) {
        // 9 minutes exceeded -> Display countdown warning
        setShowWarning(true);
        setSecondsRemaining(Math.max(1, Math.ceil(timeLeft / 1000)));
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isPublicPage, performLogout, showWarning]);

  if (!isAuthenticated || !showWarning || isPublicPage) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full mx-auto p-4 bg-white/95 backdrop-blur-xl border border-amber-200/90 rounded-2xl shadow-2xl shadow-amber-500/10 text-slate-900 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-xs text-slate-900">
              Inactivity Warning
            </h4>
            <span className="font-mono text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {secondsRemaining}s
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            You have been inactive. For your security, you will be asked to sign in again in{' '}
            <strong className="text-amber-700">{secondsRemaining} seconds</strong>.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={resetActivity}
              className="flex-1 py-1.5 px-3 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Stay Signed In</span>
            </button>
            <button
              type="button"
              onClick={performLogout}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all flex items-center justify-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
