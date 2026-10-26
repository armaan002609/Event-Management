'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  body?: string;
  duration?: number; // ms, default 4000
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  warning: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback for components rendered outside provider
    return {
      addToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return ctx;
}

// ─── Icons & Styles per type ─────────────────────────────────────
const toastConfig: Record<ToastType, { icon: React.ElementType; bg: string; border: string; iconColor: string; accentBar: string }> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-white',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-500',
    accentBar: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-white',
    border: 'border-rose-200',
    iconColor: 'text-rose-500',
    accentBar: 'bg-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-white',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    accentBar: 'bg-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-white',
    border: 'border-blue-200',
    iconColor: 'text-blue-500',
    accentBar: 'bg-blue-500',
  },
};

// ─── Single Toast Item ───────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const duration = toast.duration || 4000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`
        relative overflow-hidden max-w-sm w-full pointer-events-auto
        ${config.bg} border ${config.border} rounded-2xl shadow-2xl shadow-slate-900/10
        flex items-start gap-3 p-4 pr-10
        transition-all duration-300 ease-out
        ${isExiting ? 'toast-exit' : 'toast-enter'}
      `}
      role="alert"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${config.accentBar}`} />

      {/* Icon */}
      <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm text-slate-900 leading-snug">{toast.title}</p>
        {toast.body && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{toast.body}</p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100">
        <div
          className={`h-full ${config.accentBar} opacity-40 rounded-full`}
          style={{
            animation: `toast-progress ${toast.duration || 4000}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Toast Provider ──────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${idCounter.current++}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // max 5 visible
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, body?: string) => {
    addToast({ type: 'success', title, body });
  }, [addToast]);

  const error = useCallback((title: string, body?: string) => {
    addToast({ type: 'error', title, body, duration: 6000 });
  }, [addToast]);

  const warning = useCallback((title: string, body?: string) => {
    addToast({ type: 'warning', title, body, duration: 5000 });
  }, [addToast]);

  const info = useCallback((title: string, body?: string) => {
    addToast({ type: 'info', title, body });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
      {children}

      {/* Toast Container — fixed bottom-right */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2.5 pointer-events-none sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
