'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Home,
  Layers,
  Calendar,
  Utensils,
  Bell,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  QrCode,
  Users,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ManagerDashboard } from '@/components/manager/ManagerDashboard';
import { AllocationMatrixView } from '@/components/manager/AllocationMatrixView';
import { EventManagerView } from '@/components/manager/EventManagerView';
import { MealsLiveView } from '@/components/manager/MealsLiveView';
import { BroadcastView } from '@/components/manager/BroadcastView';
import { AuditLogView } from '@/components/manager/AuditLogView';
import { MyQrModal } from '@/components/student/MyQrModal';
import { ToastProvider } from '@/components/ui/Toast';
import { User } from '@unifest/shared';

function AnimatedTabPanel({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  const [renderKey, setRenderKey] = useState(tabKey);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (tabKey !== renderKey) {
      setVisible(false);
      const timer = setTimeout(() => {
        setRenderKey(tabKey);
        setVisible(true);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [tabKey, renderKey]);

  return (
    <div
      key={renderKey}
      className={`tab-panel-enter ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transition: 'opacity 0.08s ease' }}
    >
      {children}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('admin-center');
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          // Grant admin view to active user in Admin portal
          const adminUser = {
            ...data.user,
            role: 'ADMIN' as const,
          };
          setActiveUser(adminUser);
        } else {
          router.push('/login?redirect=/admin');
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.push('/login?redirect=/admin');
      });
  }, [router]);

  const handleUserSwitched = (newUser: User) => {
    setActiveUser(newUser);
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'admin-center':
        return 'System Command Center';
      case 'overview':
        return 'Operations Overview';
      case 'allocation-matrix':
        return 'Hostel & Bed Matrix';
      case 'event-manager':
        return 'Event Manager & Scheduling';
      case 'meals-live':
        return 'Live Mess & Meal Distribution';
      case 'broadcast':
        return 'Broadcast Notifications';
      case 'audit':
        return 'Immutable Security Audit';
      default:
        return 'Admin Portal';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <RefreshCw className="w-10 h-10 text-rose-500 animate-spin mb-4" />
        <h2 className="font-heading font-black text-lg tracking-tight">Authenticating Administrator...</h2>
        <p className="text-xs text-slate-400 mt-1">Verifying cryptographic role & permissions</p>
      </div>
    );
  }

  if (!activeUser) {
    return null;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Top Navbar */}
        <Navbar
          activeUser={activeUser}
          onUserSwitched={handleUserSwitched}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Admin Quick Switcher Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white text-xs px-4 py-2.5 border-b border-rose-900/50">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-bold text-rose-300">ADMINISTRATOR PORTAL</span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline text-slate-300">Logged in as {activeUser.name} ({activeUser.email})</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch to Student View</span>
              </Link>
              <Link
                href="/scanner"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scanner Mode</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 font-medium">
            <Link href="/" className="hover:text-slate-600 transition-colors">
              UniFest 2026
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-rose-600 font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100">
              Admin Portal
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">{getTabLabel(activeTab)}</span>
          </nav>

          <AnimatedTabPanel tabKey={activeTab}>
            {activeTab === 'admin-center' && (
              <AdminDashboard currentUser={activeUser} onNavigateTab={setActiveTab} />
            )}
            {activeTab === 'overview' && (
              <ManagerDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
            )}
            {activeTab === 'allocation-matrix' && (
              <AllocationMatrixView currentUser={activeUser} />
            )}
            {activeTab === 'event-manager' && <EventManagerView />}
            {activeTab === 'meals-live' && <MealsLiveView currentUser={activeUser} />}
            {activeTab === 'broadcast' && <BroadcastView />}
            {activeTab === 'audit' && <AuditLogView />}
          </AnimatedTabPanel>
        </main>

        {/* Personal QR Pass Modal */}
        {activeUser && (
          <MyQrModal
            isOpen={showQrModal || activeTab === 'qr'}
            onClose={() => {
              setShowQrModal(false);
              if (activeTab === 'qr') setActiveTab('admin-center');
            }}
            user={activeUser}
          />
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          <p className="font-semibold text-slate-600">
            UniFest Administrator Control Center · Full RBAC, Constraints, and Operations Authority
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Guaranteed constraint-first accommodation · Cryptographic QR engine · Real-time synchronization
          </p>
        </footer>
      </div>
    </ToastProvider>
  );
}
