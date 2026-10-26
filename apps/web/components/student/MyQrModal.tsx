'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, X, Download, Sun, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
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
    lastScan?: ScanLog | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/me/qr')
        .then((r) => r.json())
        .then((data) => {
          setQrData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, user.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center mb-3 shadow-inner">
          <QrCode className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-extrabold text-xl text-slate-900">
          Personal Festival Pass
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          One identity pass for hostel check-in and mess meals.
        </p>

        {/* High Brightness Advisory */}
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 mb-5">
          <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Turn up screen brightness for fast scanning</span>
        </div>

        {/* QR Display Frame */}
        <div className="bg-white p-4 rounded-3xl border-2 border-indigo-100 shadow-xl relative mb-5">
          {loading ? (
            <div className="w-56 h-56 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : qrData?.qrDataUrl ? (
            <img
              src={qrData.qrDataUrl}
              alt="Personal QR Code"
              className="w-56 h-56 rounded-2xl object-contain mx-auto"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-rose-500">
              Failed to load QR
            </div>
          )}
        </div>

        {/* Student Metadata Tag */}
        <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200/70 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-heading font-bold text-sm text-slate-900">{user.name}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {user.college?.code || 'PCE'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Gender: {user.gender === 'MALE' ? '♂ Male' : '♀ Female'}</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Cryptographically Signed
            </span>
          </div>
        </div>

        {/* Last Scan Status (if available) */}
        {qrData?.lastScan && (
          <div className="w-full text-left text-[11px] text-slate-500 bg-slate-100/70 p-2.5 rounded-xl mb-4">
            <span className="font-bold text-slate-700">Last Verified: </span>
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Save Image
            </a>
          )}
          <button
            onClick={() => setShowToken(!showToken)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
          >
            {showToken ? 'Hide Token' : 'View Token'}
          </button>
        </div>

        {showToken && qrData?.token && (
          <div className="mt-3 p-2 bg-slate-900 text-slate-200 rounded-lg text-[9px] font-mono break-all text-left max-h-24 overflow-y-auto w-full">
            {qrData.token}
          </div>
        )}
      </div>
    </div>
  );
}
