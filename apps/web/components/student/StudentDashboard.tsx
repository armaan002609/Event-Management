'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Home,
  Utensils,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react';
import { User, Event, isUserProfileComplete } from '@unifest/shared';

interface StudentDashboardProps {
  user: User;
  onOpenQrModal: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenProfileModal?: () => void;
}

export function StudentDashboard({ user, onOpenQrModal, onNavigateTab, onOpenProfileModal }: StudentDashboardProps) {
  const [scheduleData, setScheduleData] = useState<{
    schedule: Event[];
    nextUp: Event | null;
    conflicts: Array<{ message: string }>;
  } | null>(null);

  const [roomData, setRoomData] = useState<{
    status: string;
    hostelName?: string;
    roomNumber?: string;
    floor?: number;
    bedLabel?: string;
    lastCheckinTime?: string;
    roommates?: Array<{ name: string; bedLabel: string }>;
  } | null>(null);

  const [mealsData, setMealsData] = useState<Array<{
    slotId: string;
    type: string;
    status: string;
    batch?: { startsAt: string; endsAt: string } | null;
  }>>([]);

  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = () => {
    fetch('/api/me/schedule')
      .then((r) => r.json())
      .then((d) => setScheduleData(d))
      .catch(() => {});

    fetch('/api/me/room')
      .then((r) => r.json())
      .then((d) => setRoomData(d))
      .catch(() => {});

    fetch('/api/me/meals')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setMealsData(d);
      })
      .catch(() => {});
  };

  // Live countdown timer for Next Up event
  useEffect(() => {
    if (!scheduleData?.nextUp) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(scheduleData.nextUp!.startsAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Happening now!');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        if (hours > 0) {
          setTimeLeft(`starts in ${hours}h ${mins}m`);
        } else {
          setTimeLeft(`starts in ${mins}m ${secs}s`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduleData?.nextUp]);

  const activeMeal = mealsData.find((m) => m.status === 'OPEN_NOW') || mealsData[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-dark via-primary to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20 backdrop-blur-sm">
                {user.college?.code || 'Student'}
              </span>
              <span className="text-xs text-indigo-200">
                {user.gender === 'MALE' ? '♂ Male' : '♀ Female'}
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-indigo-200 text-sm mt-1">
              Your UniFest hub for event schedules, hostel room key, and meal batches.
            </p>
          </div>

          {/* Big Quick My QR Button */}
          <button
            onClick={onOpenQrModal}
            className="flex items-center justify-center gap-2.5 bg-white text-primary font-heading font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
          >
            <QrCode className="w-5 h-5 text-primary" />
            <span>Show My QR Pass</span>
          </button>
        </div>
      </div>

      {/* Profile Incomplete Banner */}
      {!isUserProfileComplete(user) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm mb-6 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                Complete Your Student Profile
              </h4>
              <p className="text-[11px] text-slate-600">
                Add your Father&apos;s name &amp; phone, address, college, roll no, course, and photo to unlock festival event registrations.
              </p>
            </div>
          </div>
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
            >
              Complete Profile
            </button>
          )}
        </div>
      )}

      {/* Conflicts Banner (if any) */}
      {scheduleData?.conflicts && scheduleData.conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <span className="font-bold">Schedule Conflict Detected:</span>
            {scheduleData.conflicts.map((c, i) => (
              <p key={i}>{c.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* Next Up Card */}
      {scheduleData?.nextUp ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">NEXT UP FOR YOU</span>
            </div>
            {timeLeft && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {timeLeft}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    scheduleData.nextUp.type === 'SPORTS'
                      ? 'bg-sports/10 text-sports dark:text-teal-700'
                      : 'bg-folk/10 text-folk-dark'
                  }`}
                >
                  {scheduleData.nextUp.type}
                </span>
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  {scheduleData.nextUp.title}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(scheduleData.nextUp.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {scheduleData.nextUp.venue}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs font-bold text-primary hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
            >
              View Full Schedule <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
          <h4 className="font-heading font-bold text-slate-800 text-sm">No Upcoming Events Registered</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3">
            Explore sports championships and cultural folk performances to participate.
          </p>
          <button
            onClick={() => onNavigateTab('events')}
            className="text-xs font-bold px-4 py-2 bg-primary text-white rounded-xl shadow-sm hover:bg-primary-dark transition-colors"
          >
            Browse Events
          </button>
        </div>
      )}

      {/* Two Grid Cards: STAY and MEALS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STAY Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                  <Home className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">Hostel Accommodation</h3>
                  <p className="text-[11px] text-slate-500">Auto-allocated: same college & gender</p>
                </div>
              </div>

              {/* Status Badge */}
              {roomData?.status === 'CHECKED_IN' ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                </span>
              ) : roomData?.status === 'ALLOCATED' ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 text-blue-600" /> Allocated
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  Pending
                </span>
              )}
            </div>

            {roomData?.status === 'PENDING' ? (
              <div className="bg-slate-50 rounded-2xl p-5 text-center my-3 border border-dashed border-slate-200">
                <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-700 font-semibold">Room allocation in progress</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Our system pairs you with peers from {user.college?.code || 'your college'}. You will receive a pass once confirmed.
                </p>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50/90 rounded-2xl p-4 border border-slate-100 my-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Hostel</span>
                  <span className="font-bold text-slate-800">{roomData?.hostelName || 'Main Hostel'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Room & Floor</span>
                  <span className="font-bold text-slate-800">
                    Room {roomData?.roomNumber || '---'} (Floor {roomData?.floor ?? 1})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Bed Allotment</span>
                  <span className="font-bold text-primary bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Bed {roomData?.bedLabel || 'A'}
                  </span>
                </div>

                {roomData?.roommates && roomData.roommates.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-200/70">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5 font-medium">
                      <Users className="w-3 h-3 text-slate-400" /> Same-College Roommates:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {roomData.roommates.map((rm, i) => (
                        <span key={i} className="text-[10px] font-medium bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
                          {rm.name} ({rm.bedLabel})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Show QR at gate for check-in
            </span>
            <button
              onClick={onOpenQrModal}
              className="font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              Open QR <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* MEALS: Interactive Timeline Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between relative transition-all duration-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-sm">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">Mess & Dining</h3>
                  <p className="text-[11px] text-slate-500">Staggered batch time windows</p>
                </div>
              </div>

              {activeMeal?.status === 'OPEN_NOW' ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shadow-sm animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Open Now
                </span>
              ) : activeMeal?.status === 'REDEEMED' ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  Redeemed
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  Upcoming
                </span>
              )}
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-6 space-y-4 my-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {mealsData.map((meal) => {
                const startTime = meal.batch
                  ? new Date(meal.batch.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--';
                const endTime = meal.batch
                  ? new Date(meal.batch.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--';

                const isOpen = meal.status === 'OPEN_NOW';
                const isRedeemed = meal.status === 'REDEEMED';

                return (
                  <div key={meal.slotId} className="relative group">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all ${
                        isOpen
                          ? 'bg-emerald-500 ring-4 ring-emerald-100 scale-125'
                          : isRedeemed
                          ? 'bg-slate-400'
                          : 'bg-amber-400'
                      }`}
                    />

                    {/* Meal Item Content */}
                    <div
                      className={`p-3 rounded-2xl border transition-all ${
                        isOpen
                          ? 'bg-emerald-50/60 border-emerald-200 shadow-sm'
                          : 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">{meal.type}</span>
                            {isOpen && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                                Ready
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {meal.batch ? `Batch Window: ${startTime} - ${endTime}` : 'No batch assigned'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isOpen ? (
                            <button
                              onClick={onOpenQrModal}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1"
                            >
                              <QrCode className="w-3 h-3" /> Scan Now
                            </button>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                isRedeemed
                                  ? 'bg-slate-200/80 text-slate-600'
                                  : meal.status === 'MISSED'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isRedeemed ? 'Redeemed' : meal.status === 'MISSED' ? 'Missed' : 'Upcoming'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Valid 1 token per student slot</span>
            <button
              onClick={() => onNavigateTab('meals')}
              className="font-bold text-primary hover:underline flex items-center gap-1"
            >
              Full Menu & Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
