'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Home,
  CheckCircle2,
  Utensils,
  AlertTriangle,
  QrCode,
  Layers,
  CalendarPlus,
  Send,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { ScanLog, NotificationLog } from '@unifest/shared';

interface ManagerDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export function ManagerDashboard({ onNavigateTab }: ManagerDashboardProps) {
  const [stats, setStats] = useState<{
    totalRegistered: number;
    allocatedBeds: number;
    totalBeds: number;
    checkedInCount: number;
    mealsServedCount: number;
    shortfallsCount: number;
  }>({
    totalRegistered: 0,
    allocatedBeds: 0,
    totalBeds: 0,
    checkedInCount: 0,
    mealsServedCount: 0,
    shortfallsCount: 0,
  });

  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
  const [alerts, setAlerts] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [matrixRes, scansRes, notifsRes, mealsRes] = await Promise.all([
        fetch('/api/allocations/matrix').then((r) => r.json()),
        fetch('/api/scans').then((r) => r.json()),
        fetch('/api/notifications/logs').then((r) => r.json()),
        fetch('/api/meals/live').then((r) => r.json()),
      ]);

      let checkedIn = 0;
      if (matrixRes.matrix) {
        matrixRes.matrix.forEach((h: any) => {
          h.floors.forEach((f: any) => {
            f.rooms.forEach((r: any) => {
              r.beds.forEach((b: any) => {
                if (b.allocation?.checkedIn) checkedIn++;
              });
            });
          });
        });
      }

      let totalMeals = 0;
      if (mealsRes.slots) {
        mealsRes.slots.forEach((s: any) => {
          totalMeals += s.totalServed || 0;
        });
      }

      setStats({
        totalRegistered: (matrixRes.stats?.occupiedBeds || 0) + (matrixRes.stats?.unallocatedCount || 0),
        allocatedBeds: matrixRes.stats?.occupiedBeds || 0,
        totalBeds: matrixRes.stats?.totalBeds || 0,
        checkedInCount: checkedIn,
        mealsServedCount: totalMeals,
        shortfallsCount: matrixRes.stats?.shortfalls?.length || 0,
      });

      if (Array.isArray(scansRes)) setRecentScans(scansRes.slice(0, 8));
      if (Array.isArray(notifsRes)) setAlerts(notifsRes.filter((n) => n.type.includes('SHORTFALL') || n.type.includes('UPDATE') || n.type.includes('CANCEL')).slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const occupancyPercent = stats.totalBeds > 0 ? Math.round((stats.allocatedBeds / stats.totalBeds) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900">Festival Operations Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring for inter-college events, safety-locked hostels, and meal batches.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('allocation-matrix')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
          >
            <Layers className="w-3.5 h-3.5" /> Room Matrix
          </button>
          <button
            onClick={() => onNavigateTab('event-manager')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-sm transition-all"
          >
            <CalendarPlus className="w-3.5 h-3.5" /> New Event
          </button>
          <a
            href="/scanner"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-all"
          >
            <QrCode className="w-3.5 h-3.5" /> Open Scanner
          </a>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Registered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Students</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-2xl text-slate-900">{stats.totalRegistered}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Verified Participants</p>
          </div>
        </div>

        {/* Hostel Allocated */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allocated</span>
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading font-extrabold text-2xl text-slate-900">{stats.allocatedBeds}</span>
              <span className="text-xs text-slate-400 font-medium">/ {stats.totalBeds} beds</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${occupancyPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Checked In</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-2xl text-emerald-600">{stats.checkedInCount}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Currently on Campus</p>
          </div>
        </div>

        {/* Meals Served */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meals Served</span>
            <Utensils className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-2xl text-amber-600">{stats.mealsServedCount}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Redemptions Today</p>
          </div>
        </div>

        {/* Alerts / Shortfalls */}
        <div
          onClick={() => onNavigateTab('allocation-matrix')}
          className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
            stats.shortfallsCount > 0
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Capacity Shortfalls</span>
            <ShieldAlert className={`w-4 h-4 ${stats.shortfallsCount > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div>
            <span className={`font-heading font-extrabold text-2xl ${stats.shortfallsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {stats.shortfallsCount}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.shortfallsCount > 0 ? 'Action required in Matrix' : 'Zero shortfalls'}
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column: Alert Feed and Recent Scans Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Alert Feed */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-heading font-bold text-sm text-slate-900">Live Operation Alerts</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Broadcasts & Shortfalls</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No active alerts right now.</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{alert.subject}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px] line-clamp-2">{alert.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Managers receive all domain notices</span>
            <button
              onClick={() => onNavigateTab('broadcast')}
              className="font-bold text-primary hover:underline flex items-center gap-1"
            >
              Compose Broadcast <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Scans Feed */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-bold text-sm text-slate-900">Recent Verification Scans</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Hostel & Mess gates</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {recentScans.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No scans recorded yet.</p>
              ) : (
                recentScans.map((scan) => {
                  const isAllowed = scan.result === 'ALLOWED';
                  return (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAllowed ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
                          }`}
                        />
                        <div>
                          <p className="font-bold text-slate-800">
                            {scan.userName || 'Student'} · {scan.collegeCode || 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {scan.context} {scan.reason ? `· ${scan.reason}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {scan.result}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {new Date(scan.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Instant audit on every scan</span>
            <a href="/scanner" className="font-bold text-primary hover:underline flex items-center gap-1">
              Launch Scanner Screen <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
