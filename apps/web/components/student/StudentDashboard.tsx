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
  Key,
  Wifi,
} from 'lucide-react';
import { User, Event } from '@unifest/shared';

interface StudentDashboardProps {
  user: User;
  onOpenQrModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export function StudentDashboard({ user, onOpenQrModal, onNavigateTab }: StudentDashboardProps) {
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

      {/* Two Grid Cards: STAY (Digital Key Card) and MEALS (Timeline) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STAY: Digital Room Key Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center font-bold shadow-sm">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    Digital Room Key
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded-full border border-indigo-100">
                      NFC Pass
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Auto-allocated room & bed</p>
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
              /* Digital Key Card Visual */
              <div className="my-2 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-lg relative overflow-hidden border border-indigo-800/40">
                {/* Holographic Sheen & Geometric Lines */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-xl pointer-events-none" />
                <div className="absolute right-4 top-4 flex items-center gap-1 text-white/30">
                  <Wifi className="w-4 h-4 rotate-90" />
                </div>

                {/* Card Top Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-5 rounded bg-amber-400/80 border border-amber-300/40 shadow-inner flex items-center justify-center">
                      <div className="w-3.5 h-3 border border-amber-600/40 rounded-sm" />
                    </div>
                    <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase">
                      UNIFEST ACCESS
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10 backdrop-blur-sm">
                    {user.college?.code || 'PASS'}
                  </span>
                </div>

                {/* Big Room Number & Bed */}
                <div className="flex items-end justify-between py-1 border-b border-white/10">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">ROOM / BED</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-heading tracking-tight text-white">
                        {roomData?.roomNumber || '---'}
                      </span>
                      <span className="text-sm font-bold text-indigo-300">
                        Bed {roomData?.bedLabel || 'A'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">FLOOR</span>
                    <p className="text-sm font-bold text-white">Floor {roomData?.floor ?? 1}</p>
                  </div>
                </div>

                {/* Hostel Name & Holder */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">HOSTEL</span>
                    <span className="font-semibold text-slate-200">{roomData?.hostelName || 'Main Hostel'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">KEY HOLDER</span>
                    <span className="font-semibold text-slate-200">{user.name}</span>
                  </div>
                </div>

                {/* Roommates Pill bar */}
                {roomData?.roommates && roomData.roommates.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                    <span className="text-[10px] text-slate-300 truncate">
                      Roommates: {roomData.roommates.map((r) => `${r.name} (${r.bedLabel})`).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Show QR at gate
            </span>
            <button
              onClick={onOpenQrModal}
              className="font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Tap to Open QR</span>
              <ChevronRight className="w-3.5 h-3.5" />
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
