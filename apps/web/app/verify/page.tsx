'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trophy,
  School,
  User,
  Home,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

function VerifyPassContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No QR token provided in verification link.');
      setLoading(false);
      return;
    }

    fetch(`/api/qr/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error while verifying credential pass.');
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 dark:border-slate-800 text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary dark:text-primary-light flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-black text-base text-slate-900 dark:text-white tracking-tight leading-none">
                UniFest 2026
              </h1>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Official Festival Identity Pass</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-primary dark:text-primary-light border border-indigo-100 dark:border-indigo-800">
            Pass Verification
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-9 h-9 text-primary animate-spin mx-auto" />
            <h3 className="font-heading font-extrabold text-sm text-slate-800 dark:text-slate-200">
              Verifying Cryptographic Pass...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Checking JWT signature and student accreditation.</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="font-heading font-black text-lg text-slate-900 dark:text-white">
              Invalid or Expired Pass
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              {error}
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                <span>Return to Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Valid Verified Pass */}
        {!loading && data && data.valid && (
          <div className="pt-6 space-y-5">
            {/* Status Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-heading font-black text-xs text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                  Verified &amp; Accredited Student
                </h3>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Official authentic digital festival pass.</p>
              </div>
            </div>

            {/* Student ID Card Visual */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:to-indigo-950/40 border border-slate-200/80 dark:border-slate-700 flex items-center gap-4">
              {data.user.avatarUrl ? (
                <img
                  src={data.user.avatarUrl}
                  alt={data.user.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-primary shadow-sm ring-2 ring-primary/10 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center shadow-sm shrink-0">
                  {data.user.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-heading font-black text-base text-slate-900 dark:text-white truncate">
                  {data.user.name}
                </h2>
                <p className="text-xs font-semibold text-primary dark:text-primary-light truncate flex items-center gap-1 mt-0.5">
                  <School className="w-3.5 h-3.5 shrink-0" />
                  <span>{data.user.collegeName}</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light border border-primary/20">
                    {data.user.role}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {data.user.gender === 'MALE' ? '♂ Male' : '♀ Female'}
                  </span>
                  {data.user.rollNo && (
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                      ID: {data.user.rollNo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {data.user.course && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Course</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{data.user.course}</span>
                </div>
              )}
              {data.user.passingYear && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Passing Year</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{data.user.passingYear}</span>
                </div>
              )}
              {data.user.fatherName && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 col-span-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Father&apos;s Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{data.user.fatherName}</span>
                </div>
              )}
            </div>

            {/* Hostel Status: Prominently displaying Hostel, Room, Floor & Bed */}
            {data.hostelInfo && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-primary dark:text-primary-light" />
                    <span>Hostel Accommodation</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      data.hostelInfo.isCheckedIn
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {data.hostelInfo.isCheckedIn ? '✓ Checked In' : 'Room Allotted'}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-3 border border-indigo-100/60 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Building</span>
                    <span className="font-bold text-slate-900 dark:text-white">{data.hostelInfo.hostelName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Room &amp; Floor</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Room {data.hostelInfo.roomNumber} ({data.hostelInfo.floor === 0 ? 'Ground Floor' : `Floor ${data.hostelInfo.floor}`})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned Bed</span>
                    <span className="font-bold text-primary dark:text-primary-light">{data.hostelInfo.bedLabel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Cryptographic Badge */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Cryptographically Validated
              </span>
              <span>UniFest 2026 Security</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">
          Loading Pass...
        </div>
      }
    >
      <VerifyPassContent />
    </Suspense>
  );
}
