'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  X,
  Download,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Bed,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { User, ScanLog } from '@unifest/shared';

interface MyQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function MyQrModal({ isOpen, onClose, user }: MyQrModalProps) {
  const [qrData, setQrData] = useState<{
    token: string;
    qrDataUrl: string;
    verifyUrl?: string;
    roomInfo?: {
      hostelName: string;
      roomNumber: string;
      floor: number;
      bedLabel: string;
      isCheckedIn: boolean;
    } | null;
    lastScan?: ScanLog | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const endpoint = user?.id ? `/api/me/qr?userId=${encodeURIComponent(user.id)}` : '/api/me/qr';

    const fetchQrData = () => {
      fetch(endpoint)
        .then((r) => r.json())
        .then((data) => {
          if (isMounted) {
            setQrData(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    };

    setLoading(true);
    fetchQrData();

    // Live auto-polling every 2.5 seconds: updates immediately the second QR is scanned at the gate!
    const interval = setInterval(fetchQrData, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center my-auto transition-colors duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-primary dark:text-primary-light flex items-center justify-center mb-3 shadow-inner">
          <QrCode className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
          Personal Festival Pass
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          One identity pass for hostel check-in and mess meals.
        </p>

        {/* High Brightness Advisory */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 mb-4">
          <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Turn up screen brightness for fast scanning</span>
        </div>

        {/* QR Display Frame (kept pure white inside for camera optical contrast) */}
        <div className="bg-white p-3.5 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/40 shadow-xl relative mb-4">
          {loading ? (
            <div className="w-52 h-52 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : qrData?.qrDataUrl ? (
            <img
              src={qrData.qrDataUrl}
              alt="Personal QR Code"
              className="w-52 h-52 rounded-2xl object-contain mx-auto"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-xs text-rose-500">
              Failed to load QR
            </div>
          )}
        </div>

        {/* ASSIGNED ROOM & FLOOR NOTIFICATION CARD */}
        {qrData?.roomInfo ? (
          <div className="w-full bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl p-3.5 text-left mb-3.5 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {qrData.roomInfo.hostelName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                {qrData.roomInfo.isCheckedIn ? 'Checked In' : 'Room Allotted'}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-emerald-200/60 dark:border-emerald-800">
              <div className="flex items-baseline gap-2">
                <span className="font-heading font-black text-xl text-slate-900 dark:text-white">
                  Room {qrData.roomInfo.roomNumber}
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {qrData.roomInfo.floor === 0 ? 'Ground Floor' : `Floor ${qrData.roomInfo.floor}`}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 text-xs font-black text-emerald-700 dark:text-emerald-300 shadow-sm flex items-center gap-1">
                <Bed className="w-3 h-3" /> {qrData.roomInfo.bedLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 text-center text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-light" />
            <span>Room &amp; floor will auto-allot when scanned at gate</span>
          </div>
        )}

        {/* Student Metadata Tag */}
        <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-700 mb-3.5">
          <div className="flex items-center justify-between">
            <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">{user.name}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light border border-primary/20">
              {user.college?.code || 'PCE'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>Gender: {user.gender === 'MALE' ? '♂ Male' : '♀ Female'}</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Cryptographically Signed
            </span>
          </div>
        </div>

        {/* Last Scan Status (if available) */}
        {qrData?.lastScan && (
          <div className="w-full text-left text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/80 p-2.5 rounded-xl mb-3.5">
            <span className="font-bold text-slate-700 dark:text-slate-300">Last Verified: </span>
            <span>
              {qrData.lastScan.context} (
              {new Date(qrData.lastScan.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex items-center gap-2">
          {qrData?.qrDataUrl && (
            <a
              href={qrData.qrDataUrl}
              download={`${user.name.replace(/\s+/g, '_')}_UniFest_QR.png`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Save Image
            </a>
          )}
          <button
            onClick={() => setShowToken(!showToken)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors"
          >
            {showToken ? 'Hide Token' : 'View Token'}
          </button>
        </div>

        {qrData?.verifyUrl && (
          <a
            href={qrData.verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-primary dark:text-primary-light border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open &amp; Test Digital Pass</span>
          </a>
        )}

        {showToken && qrData?.token && (
          <div className="mt-3 p-2 bg-slate-900 dark:bg-slate-950 text-slate-200 rounded-lg text-[9px] font-mono break-all text-left max-h-24 overflow-y-auto w-full border border-slate-800">
            {qrData.token}
          </div>
        )}
      </div>
    </div>
  );
}
