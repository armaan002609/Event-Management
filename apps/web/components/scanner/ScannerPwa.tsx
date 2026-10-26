'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Camera,
  Flashlight,
  RefreshCw,
  Search,
  ArrowLeft,
  Volume2,
  VolumeX,
  PhoneCall,
  Wifi,
  WifiOff,
  History,
  Lock,
  Unlock,
  ChevronDown,
} from 'lucide-react';
import { ScanContext, ScanResult, ScanResponse, User, MealSlot } from '@unifest/shared';
import { sounds } from '@/lib/feedback';

export function ScannerPwa() {
  const [context, setContext] = useState<ScanContext>('HOSTEL_CHECKIN');
  const [slotId, setSlotId] = useState<string>('');
  const [mealSlots, setMealSlots] = useState<MealSlot[]>([]);
  const [isModeLocked, setIsModeLocked] = useState(true);

  // Scanning state
  const [isScanning, setIsScanning] = useState(true);
  const [scanResultOverlay, setScanResultOverlay] = useState<ScanResponse | null>(null);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [scansCountToday, setScansCountToday] = useState(14);
  const [recentScans, setRecentScans] = useState<Array<{ name: string; result: string; time: string; college: string }>>([]);

  // Offline queue state
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Demo scan users
  const [demoStudents, setDemoStudents] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Network listeners
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load meal slots
    fetch('/api/meals/slots')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setMealSlots(d);
          if (d.length > 0) setSlotId(d[0].id);
        }
      })
      .catch(() => {});

    // Load demo students for fast 1-click test scanning
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.demoUsers) {
          setDemoStudents(d.demoUsers.filter((u: any) => u.role === 'STUDENT'));
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const flushOfflineQueue = async () => {
    // Sync any queued scans
    if (offlineQueue.length === 0) return;
    const queue = [...offlineQueue];
    setOfflineQueue([]);
    for (const req of queue) {
      try {
        await fetch('/api/scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
      } catch (e) {
        console.error('Failed to flush queued scan', e);
      }
    }
  };

  const executeScan = async (tokenString: string) => {
    if (!tokenString) return;

    const clientScanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      token: tokenString,
      context,
      slotId: context === 'MEAL' ? slotId : undefined,
      clientScanId,
      deviceInfo: 'Scanner PWA Mobile #1',
    };

    if (!isOnline) {
      // Offline mode: queue locally
      setOfflineQueue((prev) => [...prev, payload]);
      const mockOfflineResponse: ScanResponse = {
        result: 'ALLOWED',
        allowed: true,
        message: 'QUEUED OFFLINE (Will sync when network returns)',
        clientScanId,
        user: { id: 'offline', name: 'Offline Student', gender: 'MALE', collegeCode: 'CACHED', collegeName: 'Cached' },
      };
      displayScanResult(mockOfflineResponse);
      return;
    }

    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: ScanResponse = await res.json();
      displayScanResult(data);
    } catch {
      const errResponse: ScanResponse = {
        result: 'DENIED_INVALID',
        allowed: false,
        message: 'Network connection failure while verifying token.',
        clientScanId,
      };
      displayScanResult(errResponse);
    }
  };

  const displayScanResult = (res: ScanResponse) => {
    setScanResultOverlay(res);
    setScansCountToday((prev) => prev + 1);

    if (res.allowed) {
      if (soundEnabled) sounds.playSuccess();
    } else {
      if (soundEnabled) sounds.playError();
    }

    // Add to recent feed
    setRecentScans((prev) => [
      {
        name: res.user?.name || 'Unknown',
        result: res.result,
        college: res.user?.collegeCode || 'N/A',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 7),
    ]);

    // Auto dismiss after 2.5 seconds per UX spec
    setTimeout(() => {
      setScanResultOverlay(null);
    }, 2500);
  };

  // Quick test scan for a student
  const handleQuickTestScan = async (userId: string) => {
    // Generate valid signed token for this student
    const res = await fetch(`/api/me/qr`);
    // Or switch demo to student, fetch their QR token, and scan it!
    const tokenRes = await fetch('/api/auth/switch-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const qrRes = await fetch('/api/me/qr');
    const qrData = await qrRes.json();
    if (qrData.token) {
      executeScan(qrData.token);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none relative overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-30">
        <Link
          href="/"
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Portal
        </Link>

        {/* Network status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
              <WifiOff className="w-3 h-3" /> Offline ({offlineQueue.length} queued)
            </span>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mode Selector & Lock */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-3 z-20">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Scanner Context Mode:
            </label>
            <button
              onClick={() => setIsModeLocked(!isModeLocked)}
              className="text-[10px] font-bold flex items-center gap-1 text-primary-light"
            >
              {isModeLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
              {isModeLocked ? 'Locked' : 'Unlocked'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            <button
              disabled={isModeLocked}
              onClick={() => setContext('HOSTEL_CHECKIN')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                context === 'HOSTEL_CHECKIN'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 disabled:opacity-60'
              }`}
            >
              Hostel IN
            </button>
            <button
              disabled={isModeLocked}
              onClick={() => setContext('HOSTEL_CHECKOUT')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                context === 'HOSTEL_CHECKOUT'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 disabled:opacity-60'
              }`}
            >
              Hostel OUT
            </button>
            <button
              disabled={isModeLocked}
              onClick={() => setContext('MEAL')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                context === 'MEAL'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 disabled:opacity-60'
              }`}
            >
              Meal Mess
            </button>
          </div>

          {context === 'MEAL' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Meal Slot:</span>
              <select
                disabled={isModeLocked}
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                className="bg-slate-800 text-white text-xs p-1 rounded-lg border border-slate-700 disabled:opacity-60 focus:outline-none"
              >
                {mealSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.type} ({s.date})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Center Camera Viewfinder Reticle */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-indigo-500/40 bg-slate-900/60 shadow-2xl relative flex items-center justify-center overflow-hidden scanner-reticle">
          {/* Corner Guides */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

          {/* Camera Viewfinder Graphic */}
          <div className="flex flex-col items-center text-center p-4">
            <Camera className="w-10 h-10 text-indigo-400/80 mb-2 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">Point at Student QR</span>
            <span className="text-[10px] text-slate-500 mt-0.5">High-speed verification active</span>
          </div>
        </div>

        {/* Quick Simulation Buttons (Test Scanner without physical camera) */}
        <div className="w-full max-w-sm mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Quick Test Scan:</span>
            <span>Tap to verify</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {demoStudents.map((st) => (
              <button
                key={st.id}
                onClick={() => handleQuickTestScan(st.id)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>{st.name.split(' ')[0]} ({st.college?.code || 'PCE'})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Token Paste Fallback */}
        <div className="w-full max-w-sm mt-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualTokenInput}
              onChange={(e) => setManualTokenInput(e.target.value)}
              placeholder="Or paste QR token manually..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => {
                executeScan(manualTokenInput);
                setManualTokenInput('');
              }}
              className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark"
            >
              Verify
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Counter & History Drawer */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800 z-20">
        <div className="max-w-sm mx-auto flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">Today's Total Scans:</span>
            <p className="font-heading font-extrabold text-base text-white">{scansCountToday}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Context: <strong>{context}</strong></span>
          </div>
        </div>

        {/* Recent mini stream */}
        {recentScans.length > 0 && (
          <div className="max-w-sm mx-auto mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[10px]">
            {recentScans.slice(0, 4).map((s, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded whitespace-nowrap font-medium ${
                  s.result === 'ALLOWED' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                }`}
              >
                {s.name} ({s.college}): {s.result === 'ALLOWED' ? '✓' : '✗'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FULL-SCREEN RESULT OVERLAY (UX SPEC 4.3: High-contrast Green / Red readable from arm's length) */}
      {scanResultOverlay && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in-95 duration-150 ${
            scanResultOverlay.allowed ? 'scan-allowed-overlay' : 'scan-denied-overlay'
          }`}
        >
          {scanResultOverlay.allowed ? (
            <div className="flex flex-col items-center space-y-4 max-w-sm">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-2xl">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>

              <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight">
                ALLOWED
              </h1>

              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 w-full text-left space-y-1">
                <p className="font-heading font-extrabold text-lg text-white">
                  {scanResultOverlay.user?.name}
                </p>
                <p className="text-xs text-white/90 font-semibold">
                  {scanResultOverlay.user?.collegeCode} ({scanResultOverlay.user?.collegeName}) · {scanResultOverlay.user?.gender === 'MALE' ? '♂ M' : '♀ F'}
                </p>

                {scanResultOverlay.details?.roomNumber && (
                  <p className="text-sm font-bold text-white pt-1">
                    {scanResultOverlay.details.hostelName} · Room {scanResultOverlay.details.roomNumber} ({scanResultOverlay.details.bedLabel})
                  </p>
                )}

                {scanResultOverlay.details?.mealBatchWindow && (
                  <p className="text-xs font-semibold text-white/90 pt-1">
                    Meal Batch: {scanResultOverlay.details.mealBatchWindow}
                  </p>
                )}
              </div>

              <span className="text-[11px] text-white/70 animate-pulse">Auto-resetting in 2s...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 max-w-sm">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-2xl">
                <XCircle className="w-16 h-16 text-white" />
              </div>

              <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight">
                DENIED
              </h1>

              <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 w-full text-center space-y-2">
                <p className="text-sm font-bold text-white leading-snug">
                  {scanResultOverlay.message}
                </p>
                {scanResultOverlay.user && (
                  <p className="text-xs text-white/80">
                    {scanResultOverlay.user.name} ({scanResultOverlay.user.collegeCode})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="tel:100"
                  className="px-4 py-2 rounded-xl bg-white text-rose-700 text-xs font-bold shadow-lg flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call Manager
                </a>
                <button
                  onClick={() => setScanResultOverlay(null)}
                  className="px-4 py-2 rounded-xl bg-black/30 text-white text-xs font-bold hover:bg-black/40"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
