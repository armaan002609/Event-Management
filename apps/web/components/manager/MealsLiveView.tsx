'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { User } from '@unifest/shared';
import { useToast } from '@/components/ui/Toast';

interface MealsLiveViewProps {
  currentUser: User;
}

export function MealsLiveView({ currentUser }: MealsLiveViewProps) {
  const toast = useToast();
  const [liveData, setLiveData] = useState<{
    slots: Array<{
      slotId: string;
      date: string;
      type: string;
      totalServed: number;
      exceptionsCount: number;
      totalEligible: number;
      percent: number;
      batches: Array<{
        batchId: string;
        collegeCode: string;
        collegeName: string;
        collegeColor: string;
        gender: string;
        startsAt: string;
        endsAt: string;
        servedCount: number;
        eligibleCount: number;
        percent: number;
      }>;
    }>;
    recentRedemptions: Array<{
      id: string;
      userName?: string;
      collegeCode?: string;
      slotType?: string;
      isException?: boolean;
      at: string;
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  // Auto Generate Batches Modal State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genSlotId, setGenSlotId] = useState('');
  const [genStartTime, setGenStartTime] = useState('');
  const [genDuration, setGenDuration] = useState('20');
  const [isGenerating, setIsGenerating] = useState(false);

  // Meal Exception Modal State
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exUserId, setExUserId] = useState('');
  const [exSlotId, setExSlotId] = useState('');
  const [exReason, setExReason] = useState('');
  const [exError, setExError] = useState<string | null>(null);
  const [isSubmittingEx, setIsSubmittingEx] = useState(false);
  const [studentsList, setStudentsList] = useState<User[]>([]);

  useEffect(() => {
    loadLiveMeals();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.users) {
          setStudentsList(d.users.filter((u: any) => u.role === 'STUDENT'));
        }
      })
      .catch(() => {});
  }, []);

  const loadLiveMeals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meals/live');
      const data = await res.json();
      setLiveData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatches = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/meals/batches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: genSlotId,
          startTime: new Date(genStartTime).toISOString(),
          batchDurationMinutes: parseInt(genDuration, 10),
        }),
      });
      if (res.ok) {
        setShowGenModal(false);
        toast.success('Batches Generated', 'Meal batches have been generated successfully.');
        loadLiveMeals();
      } else {
        const d = await res.json();
        toast.error('Generation Failed', d.error || 'Failed to generate batches');
      }
    } catch {
      toast.error('Network Error', 'Could not reach the server to generate batches.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGrantException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exUserId || !exSlotId || !exReason.trim()) {
      setExError('Please fill all fields');
      return;
    }
    setIsSubmittingEx(true);
    setExError(null);
    try {
      const res = await fetch('/api/meals/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: exUserId,
          slotId: exSlotId,
          reason: exReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExError(data.error || 'Failed to grant meal exception');
      } else {
        setShowExceptionModal(false);
        loadLiveMeals();
      }
    } catch (err: unknown) {
      setExError((err as Error).message);
    } finally {
      setIsSubmittingEx(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900">Mess Halls & Meal Batches</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time food counter redemptions and generate staggered dining batches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (liveData?.slots?.[0]) setExSlotId(liveData.slots[0].slotId);
              setExReason('');
              setExError(null);
              setShowExceptionModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Grant Meal Exception
          </button>

          <button
            onClick={() => {
              const now = new Date();
              setGenStartTime(now.toISOString().slice(0, 16));
              if (liveData?.slots?.[0]) setGenSlotId(liveData.slots[0].slotId);
              setShowGenModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Auto-Generate Batches
          </button>
        </div>
      </div>

      {/* Main Slots Section */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Checking dining mess queues...</p>
        </div>
      ) : liveData ? (
        liveData.slots.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center">
            <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-heading font-extrabold text-base text-slate-800">No Active Meal Slots Today</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Dining schedules and staggered batches will appear here once scheduled. Real-time redemptions can be monitored live as scanners verify student QR codes at the dining hall entrance.
            </p>
          </div>
        ) : (
        <div className="space-y-6">
          {liveData.slots.map((slot) => (
            <div key={slot.slotId} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-lg text-slate-900">{slot.type}</h3>
                    <p className="text-xs text-slate-400">Date: {slot.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Total Served</span>
                    <p className="font-heading font-extrabold text-base text-slate-900">
                      {slot.totalServed} <span className="text-xs font-normal text-slate-400">/ {slot.totalEligible}</span>
                    </p>
                  </div>

                  {slot.exceptionsCount > 0 && (
                    <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
                      {slot.exceptionsCount} Exceptions
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 font-semibold">
                  <span>Dining Hall Capacity Progress</span>
                  <span>{slot.percent}% served</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${slot.percent}%` }}
                  />
                </div>
              </div>

              {/* Batches Grid */}
              <div className="space-y-2 pt-2">
                <h4 className="font-heading font-bold text-xs text-slate-700">
                  Assigned Batches by College & Gender ({slot.batches.length})
                </h4>

                {slot.batches.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-xl text-center">
                    No batches generated for this slot. Click "Auto-Generate Batches" to stagger service.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {slot.batches.map((b) => (
                      <div
                        key={b.batchId}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="font-bold text-[10px] px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: b.collegeColor }}
                          >
                            {b.collegeCode} ({b.gender === 'MALE' ? '♂ M' : '♀ F'})
                          </span>
                          <span className="text-[10px] font-bold text-slate-600">
                            {b.servedCount} / {b.eligibleCount}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(b.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {new Date(b.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${b.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )
      ) : null}

      {/* Auto Generate Batches Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleGenerateBatches}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                Staggered Batch Generator
              </h3>
              <button
                type="button"
                onClick={() => setShowGenModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Automatically calculates staggered time slots for each (college x gender) pair to prevent long dining queues.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Slot</label>
              <select
                value={genSlotId}
                onChange={(e) => setGenSlotId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {liveData?.slots.map((s) => (
                  <option key={s.slotId} value={s.slotId}>
                    {s.type} ({s.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">First Batch Start Time</label>
              <input
                type="datetime-local"
                value={genStartTime}
                onChange={(e) => setGenStartTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration per Batch (Minutes)</label>
              <input
                type="number"
                value={genDuration}
                onChange={(e) => setGenDuration(e.target.value)}
                min="10"
                max="60"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowGenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Batches'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grant Meal Exception Modal */}
      {showExceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleGrantException}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                Grant One-Time Meal Exception
              </h3>
              <button
                type="button"
                onClick={() => setShowExceptionModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {exError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                {exError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student</label>
              <select
                value={exUserId}
                onChange={(e) => setExUserId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              >
                <option value="">-- Choose Student --</option>
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.college?.code || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Meal Slot</label>
              <select
                value={exSlotId}
                onChange={(e) => setExSlotId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              >
                {liveData?.slots.map((s) => (
                  <option key={s.slotId} value={s.slotId}>
                    {s.type} ({s.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Reason (Logged in AuditLog)
              </label>
              <textarea
                value={exReason}
                onChange={(e) => setExReason(e.target.value)}
                rows={3}
                placeholder="e.g., Extended match delay, medical dietary requirement, bus arrival delay..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowExceptionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEx}
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md hover:bg-amber-700 transition-all disabled:opacity-50"
              >
                {isSubmittingEx ? 'Granting...' : 'Grant Exception'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
