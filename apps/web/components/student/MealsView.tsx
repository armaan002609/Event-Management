'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, Clock, CheckCircle2, AlertCircle, Info, QrCode } from 'lucide-react';
import { User } from '@unifest/shared';

interface MealsViewProps {
  user: User;
  onOpenQrModal: () => void;
}

export function MealsView({ user, onOpenQrModal }: MealsViewProps) {
  const [meals, setMeals] = useState<Array<{
    slotId: string;
    date: string;
    type: string;
    status: 'UPCOMING' | 'OPEN_NOW' | 'REDEEMED' | 'MISSED' | 'NO_BATCH';
    batch?: { startsAt: string; endsAt: string } | null;
    redemptionTime?: string | null;
    isException?: boolean;
  }>>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/meals')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setMeals(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">Festival Dining & Meals</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Meals are served in staggered batches by college & gender to avoid mess hall crowding.
          </p>
        </div>

        <button
          onClick={onOpenQrModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" /> Show Meal QR
        </button>
      </div>

      {/* Rules Notice */}
      <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary dark:text-primary-light shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
          <p className="font-bold">Dining Hall Policies (BR-7 & BR-8):</p>
          <ul className="list-disc list-inside space-y-0.5 text-indigo-800 dark:text-indigo-300 text-[11px]">
            <li>Each participant can redeem each meal slot at most once.</li>
            <li>Please arrive strictly during your college's assigned batch window (15-min grace window applies).</li>
            <li>Present your personal UniFest QR to the scanner operator at the mess counter.</li>
          </ul>
        </div>
      </div>

      {/* Meal Slots List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Checking meal batches...</p>
        </div>
      ) : meals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">No meal slots configured for today.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => {
            const startTime = meal.batch
              ? new Date(meal.batch.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;
            const endTime = meal.batch
              ? new Date(meal.batch.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            return (
              <div
                key={meal.slotId}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      meal.status === 'OPEN_NOW'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                        : meal.status === 'REDEEMED'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Utensils className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">{meal.type}</h3>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{meal.date}</span>
                    </div>

                    {meal.batch ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>
                          Your Batch Window: <strong className="text-slate-800 dark:text-slate-100">{startTime} - {endTime}</strong>
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No batch generated yet</p>
                    )}

                    {meal.redemptionTime && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                        Redeemed at {new Date(meal.redemptionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {meal.isException && ' (Manager Exception)'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="self-end sm:self-auto">
                  {meal.status === 'OPEN_NOW' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" /> Counter Open
                    </span>
                  ) : meal.status === 'REDEEMED' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Redeemed
                    </span>
                  ) : meal.status === 'MISSED' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold">
                      Batch Closed
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
                      Opens Soon
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
