'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Camera,
  RefreshCw,
  Search,
  ArrowLeft,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Upload,
  SwitchCamera,
  AlertCircle,
  ShieldCheck,
  Building2,
  Bed,
  DoorClosed,
  Clock,
  Sparkles,
  Pause,
  Play,
} from 'lucide-react';
import { ScanContext, ScanResult, ScanResponse, User, MealSlot } from '@unifest/shared';
import { sounds } from '@/lib/feedback';

export function ScannerPwa() {
  const [context, setContext] = useState<ScanContext>('HOSTEL_CHECKIN');
  const [slotId, setSlotId] = useState<string>('');
  const [mealSlots, setMealSlots] = useState<MealSlot[]>([]);
  const [isModeLocked, setIsModeLocked] = useState(false);

  // Scanning state
  const [scanResultOverlay, setScanResultOverlay] = useState<ScanResponse | null>(null);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [scansCountToday, setScansCountToday] = useState(0);
  const [recentScans, setRecentScans] = useState<Array<{ name: string; result: string; time: string; college: string }>>([]);

  // Auto-dismiss countdown timer state (default 15s, operator configurable)
  const [dismissDuration, setDismissDuration] = useState<number>(15);
  const [countdown, setCountdown] = useState<number>(15);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const html5QrCodeRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScanningRef = useRef(false);

  // Offline queue state
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const flushOfflineQueue = async () => {
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

  const executeScan = useCallback(async (tokenString: string) => {
    if (!tokenString || isScanningRef.current) return;
    isScanningRef.current = true;

    // Clean token if a full URL was scanned
    let cleanToken = tokenString.trim();
    if (cleanToken.includes('token=')) {
      try {
        const match = cleanToken.match(/token=([a-zA-Z0-9_\-\.]+)/);
        if (match && match[1]) {
          cleanToken = match[1];
        }
      } catch {}
    }

    const clientScanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      token: cleanToken,
      context,
      slotId: context === 'MEAL' ? slotId : undefined,
      clientScanId,
      deviceInfo: 'Scanner PWA Camera #1',
    };

    if (!isOnline) {
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
  }, [context, slotId, isOnline]);

  const clearDismissTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const dismissOverlay = useCallback(() => {
    clearDismissTimers();
    setScanResultOverlay(null);
    setIsTimerPaused(false);
    // Allow debounce before next scan triggers
    setTimeout(() => {
      isScanningRef.current = false;
    }, 350);
  }, [clearDismissTimers]);

  const pauseTimer = useCallback(() => {
    clearDismissTimers();
    setIsTimerPaused(true);
  }, [clearDismissTimers]);

  const resumeTimer = useCallback(() => {
    clearDismissTimers();
    setIsTimerPaused(false);
    let secondsLeft = countdown > 0 ? countdown : 15;
    setCountdown(secondsLeft);
    intervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setCountdown(secondsLeft);
      if (secondsLeft <= 0) {
        dismissOverlay();
      }
    }, 1000);
  }, [clearDismissTimers, countdown, dismissOverlay]);

  // Keyboard shortcut: Space or Enter to instantly dismiss and scan next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        if (scanResultOverlay) {
          e.preventDefault();
          dismissOverlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearDismissTimers();
    };
  }, [scanResultOverlay, dismissOverlay, clearDismissTimers]);

  const displayScanResult = (res: ScanResponse) => {
    clearDismissTimers();
    setScanResultOverlay(res);
    setScansCountToday((c) => c + 1);

    // Audio & Haptic Feedback
    if (res.allowed) {
      if (soundEnabled) sounds.allowed();
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(80); } catch {}
      }
    } else {
      if (soundEnabled) sounds.denied();
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([120, 60, 120]); } catch {}
      }
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

    // Setup countdown timer (15s default, or operator configured)
    if (dismissDuration > 0) {
      setCountdown(dismissDuration);
      setIsTimerPaused(false);
      let secondsLeft = dismissDuration;
      intervalRef.current = setInterval(() => {
        secondsLeft -= 1;
        setCountdown(secondsLeft);
        if (secondsLeft <= 0) {
          dismissOverlay();
        }
      }, 1000);
    } else {
      setCountdown(0);
      setIsTimerPaused(true);
    }
  };

  // Start Camera Scanning
  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    try {
      setCameraError(null);
      const { Html5Qrcode } = await import('html5-qrcode');

      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {}
        html5QrCodeRef.current = null;
      }

      const html5QrCode = new Html5Qrcode('scanner-viewport-box');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: facing },
        {
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          executeScan(decodedText);
        },
        () => {}
      );

      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(err?.message || 'Unable to access camera. Please allow camera permissions.');
      setCameraActive(false);
    }
  }, [facingMode, executeScan]);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {}
      try {
        await html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    await stopCamera();
    startCamera(nextFacing);
  };

  // Handle uploading/picking an image file with a QR code
  const handleImageFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let result: string | null = null;
      if (html5QrCodeRef.current) {
        result = await html5QrCodeRef.current.scanFile(file, true);
      } else {
        const { Html5Qrcode } = await import('html5-qrcode');
        const tempScanner = new Html5Qrcode('scanner-viewport-box');
        result = await tempScanner.scanFile(file, true);
        try {
          await tempScanner.clear();
        } catch {}
      }

      if (result) {
        executeScan(result);
      }
    } catch {
      alert('Could not detect a QR code in the selected image. Please try a clearer picture.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Automatically start camera on mount, clean up on unmount
  useEffect(() => {
    startCamera('environment');
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none relative overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-30">
        <Link
          href="/"
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Portal
        </Link>

        {/* Network & Sound Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800">
              <WifiOff className="w-3 h-3" /> Offline ({offlineQueue.length} queued)
            </span>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
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
              Verification Context:
            </label>
            <button
              onClick={() => setIsModeLocked(!isModeLocked)}
              className="text-[10px] font-bold flex items-center gap-1 text-primary-light"
            >
              {isModeLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
              {isModeLocked ? 'Mode Locked' : 'Unlocked'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            <button
              disabled={isModeLocked}
              onClick={() => setContext('HOSTEL_CHECKIN')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                context === 'HOSTEL_CHECKIN'
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
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
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
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
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
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
                className="bg-slate-800 text-white text-xs p-1.5 rounded-lg border border-slate-700 disabled:opacity-60 focus:outline-none"
              >
                {mealSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.type} ({s.date})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Result Display Duration Selector */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Display:
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDismissDuration(15)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  dismissDuration === 15
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Overlay automatically closes after 15 seconds"
              >
                15s
              </button>
              <button
                type="button"
                onClick={() => setDismissDuration(30)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  dismissDuration === 30
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Overlay automatically closes after 30 seconds"
              >
                30s
              </button>
              <button
                type="button"
                onClick={() => setDismissDuration(0)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  dismissDuration === 0
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Overlay stays open until manually dismissed"
              >
                Keep Open
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Center Camera Viewfinder Reticle */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-indigo-500/40 bg-slate-900/90 shadow-2xl relative flex items-center justify-center overflow-hidden scanner-reticle">
          {/* Corner Guides */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg z-20 pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg z-20 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg z-20 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg z-20 pointer-events-none" />

          {/* Laser beam animation */}
          {cameraActive && <div className="scanner-laser z-20 pointer-events-none" />}

          {/* HTML5 QR Code Video Container */}
          <div id="scanner-viewport-box" className="w-full h-full object-cover z-10" />

          {/* Fallback placeholder if camera not active */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-900/95 z-10">
              <Camera className="w-10 h-10 text-indigo-400 mb-2 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">Camera Inactive</span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                {cameraError || 'Click below to start camera or upload an image.'}
              </p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="mt-3 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary-dark transition-all flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera Controls Bar */}
        <div className="flex items-center gap-3 mt-4">
          {cameraActive ? (
            <>
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                Pause Camera
              </button>
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                title="Switch Front/Back Camera"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-primary-light" />
                <span>Flip</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Enable Camera</span>
            </button>
          )}

          {/* Upload QR Image file */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileScan}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            title="Scan QR from photo / screenshot"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          {/* Quick Test Button */}
          <button
            type="button"
            onClick={async () => {
              try {
                const r = await fetch('/api/me/qr');
                const d = await r.json();
                if (d.token) {
                  executeScan(d.token);
                } else {
                  alert('Unable to load QR token for test.');
                }
              } catch (e: any) {
                alert('Test scan error: ' + e.message);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            title="Instantly test scanner with your active festival QR pass"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Test My Pass</span>
          </button>
        </div>

        {/* Manual Token Paste Fallback */}
        <div className="w-full max-w-sm mt-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualTokenInput}
              onChange={(e) => setManualTokenInput(e.target.value)}
              placeholder="Or paste QR token / link manually..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => {
                executeScan(manualTokenInput);
                setManualTokenInput('');
              }}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all"
            >
              Verify
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Counter & History Stream */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800 z-20">
        <div className="max-w-sm mx-auto flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">Today&apos;s Total Scans:</span>
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

      {/* FULL-SCREEN RESULT OVERLAY (Prominent Room Allotment Card & Countdown Display) */}
      {scanResultOverlay && (
        <div
          onClick={(e) => {
            // Dismiss if clicking directly on the background backdrop
            if (e.target === e.currentTarget) {
              dismissOverlay();
            }
          }}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 text-white text-center animate-in fade-in zoom-in-95 duration-150 overflow-y-auto ${
            scanResultOverlay.allowed
              ? 'bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950/98 backdrop-blur-md'
              : 'bg-gradient-to-b from-rose-950 via-slate-950 to-slate-950/98 backdrop-blur-md'
          }`}
        >
          {/* Top Header / Timer Bar */}
          <div className="w-full max-w-lg flex items-center justify-between pt-2 pb-3 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow ${
                  scanResultOverlay.allowed
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {scanResultOverlay.allowed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {context}
              </span>
              {scanResultOverlay.details?.isNewlyAllocated && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide uppercase bg-amber-400 text-slate-950 flex items-center gap-1 shadow animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" /> Auto-Allotted
                </span>
              )}
            </div>

            {/* Countdown timer & Pause / Resume */}
            <div className="flex items-center gap-2">
              {dismissDuration > 0 && !isTimerPaused ? (
                <button
                  type="button"
                  onClick={pauseTimer}
                  className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-colors border border-white/20"
                  title="Pause auto-dismiss to inspect card"
                >
                  <Pause className="w-3 h-3 text-amber-300" />
                  <span>Closing in {countdown}s</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeTimer}
                  className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-colors border border-white/20"
                  title="Click to resume countdown"
                >
                  <Play className="w-3 h-3 text-emerald-300" />
                  <span>Timer Paused</span>
                </button>
              )}
            </div>
          </div>

          {/* Center Card Container */}
          <div className="w-full max-w-lg my-auto py-2 flex flex-col items-center">
            {/* Status Heading */}
            <div className="mb-3 flex flex-col items-center">
              {scanResultOverlay.allowed ? (
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-1.5 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mb-1.5 shadow-lg shadow-rose-500/20">
                  <XCircle className="w-8 h-8 text-rose-400" />
                </div>
              )}

              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight drop-shadow">
                {scanResultOverlay.allowed ? 'VERIFIED · ACCESS ALLOWED' : 'ACCESS RESTRICTED'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-300 mt-1 max-w-md">
                {scanResultOverlay.message}
              </p>
            </div>

            {/* ROOM ALLOTMENT HIGHLIGHT CARD (When room details are present) */}
            {scanResultOverlay.details?.roomNumber && (
              <div className="w-full bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border-4 border-emerald-400 text-left my-2 animate-in zoom-in-95 duration-200">
                {/* Allotment Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                      {scanResultOverlay.details.hostelName || 'Hostel Allotment'}
                    </span>
                  </div>
                  {scanResultOverlay.details.isNewlyAllocated ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Newly Assigned
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                      Confirmed Room
                    </span>
                  )}
                </div>

                {/* Giant Room & Bed Numbers */}
                <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Room Number
                    </span>
                    <span className="font-heading font-black text-4xl sm:text-5xl text-slate-900 tracking-tight">
                      {scanResultOverlay.details.roomNumber}
                    </span>
                    {typeof scanResultOverlay.details.floor === 'number' && (
                      <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {scanResultOverlay.details.floor === 0
                          ? 'Ground Floor'
                          : `Floor ${scanResultOverlay.details.floor}`}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col border-l border-slate-200 pl-4">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Assigned Bed
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-heading font-black text-3xl sm:text-4xl text-emerald-600">
                        {scanResultOverlay.details.bedLabel || 'Bed A'}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5" /> Vacant bed reserved
                    </span>
                  </div>
                </div>

                {/* Student Card Summary inside Room Card */}
                {scanResultOverlay.user && (
                  <div className="pt-3 border-t border-slate-200 flex flex-col gap-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {scanResultOverlay.user.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[11px] border border-indigo-200">
                        {scanResultOverlay.user.gender}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span className="font-medium truncate max-w-[240px]">
                        🎓 {scanResultOverlay.details.collegeName || scanResultOverlay.user.collegeName}
                      </span>
                      {scanResultOverlay.user.rollNo && (
                        <span className="font-mono font-bold text-slate-800">
                          Roll: {scanResultOverlay.user.rollNo}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Standard User Card when NO Room Details (e.g. Meal, General Check, or Denied) */}
            {(!scanResultOverlay.details?.roomNumber && scanResultOverlay.user) && (
              <div className="w-full bg-slate-900/90 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 text-left my-2 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-lg text-white">
                    {scanResultOverlay.user.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    {scanResultOverlay.user.collegeCode}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mb-2">
                  🎓 {scanResultOverlay.user.collegeName}
                </p>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span>Gender: <strong>{scanResultOverlay.user.gender}</strong></span>
                  {scanResultOverlay.user.rollNo ? (
                    <span>Roll No: <strong>{scanResultOverlay.user.rollNo}</strong></span>
                  ) : (
                    <span>ID: {scanResultOverlay.user.id}</span>
                  )}
                </div>
                {scanResultOverlay.details?.mealBatchWindow && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-xs text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Meal Batch: <strong>{scanResultOverlay.details.mealBatchWindow}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Bar with "Scan Next Student" button */}
          <div className="w-full max-w-lg pb-2 pt-2">
            <button
              type="button"
              onClick={dismissOverlay}
              className="w-full py-4 px-6 rounded-2xl bg-white text-slate-950 font-black text-base sm:text-lg shadow-2xl hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-2 border-white cursor-pointer"
            >
              <span>Scan Next Student</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold tracking-wide">
                Space / Enter
              </span>
            </button>

            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {dismissDuration > 0 && !isTimerPaused ? (
                <>Screen automatically closes in <strong>{countdown}s</strong> or tap button above</>
              ) : (
                <>Screen is paused. Tap <strong>Scan Next Student</strong> when ready</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
