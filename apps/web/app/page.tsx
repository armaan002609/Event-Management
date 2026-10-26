'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { EventsBrowser } from '@/components/student/EventsBrowser';
import { MealsView } from '@/components/student/MealsView';
import { MyQrModal } from '@/components/student/MyQrModal';
import { ManagerDashboard } from '@/components/manager/ManagerDashboard';
import { AllocationMatrixView } from '@/components/manager/AllocationMatrixView';
import { EventManagerView } from '@/components/manager/EventManagerView';
import { MealsLiveView } from '@/components/manager/MealsLiveView';
import { BroadcastView } from '@/components/manager/BroadcastView';
import { AuditLogView } from '@/components/manager/AuditLogView';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ToastProvider } from '@/components/ui/Toast';
import { User } from '@unifest/shared';

// Animated wrapper for tab content — triggers CSS entry animation on key change
function AnimatedTabPanel({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  const [renderKey, setRenderKey] = useState(tabKey);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (tabKey !== renderKey) {
      setVisible(false);
      // Short delay for exit feel, then swap content and animate in
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

export default function HomePage() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setActiveUser(data.user);
          if (data.user.role === 'STUDENT') {
            setActiveTab('dashboard');
          } else if (data.user.role === 'ADMIN') {
            setActiveTab('admin-center');
          } else {
            setActiveTab('overview');
          }
        } else {
          router.push('/login');
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
        setLoading(false);
      });
  }, [router]);

  const handleUserSwitched = (newUser: User) => {
    setActiveUser(newUser);
    if (newUser.role === 'STUDENT') {
      setActiveTab('dashboard');
    } else if (newUser.role === 'ADMIN') {
      setActiveTab('admin-center');
    } else {
      setActiveTab('overview');
    }
  };

  if (loading || !activeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          {/* Skeleton loading state instead of plain spinner */}
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-heading font-bold text-slate-800 text-sm">Launching UniFest Manager...</p>
          <div className="space-y-2 w-64 mx-auto">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const isStudent = activeUser.role === 'STUDENT';

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'My Hub & Room Key';
      case 'events': return 'Festival Events & Schedule';
      case 'qr': return 'My Identity QR Pass';
      case 'meals': return 'Mess & Meal Batches';
      case 'overview': return 'Operations Control';
      case 'allocation-matrix': return 'Hostel Allocation Matrix';
      case 'event-manager': return 'Event Schedule Manager';
      case 'meals-live': return 'Mess Batches Live';
      case 'broadcast': return 'Targeted Notifications';
      case 'audit': return 'Audit Logs';
      case 'admin-center': return 'System Administration';
      default: return 'Portal';
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Global Navbar */}
        <Navbar
          activeUser={activeUser}
          onUserSwitched={handleUserSwitched}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Page Body */}
        <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${isStudent ? 'has-bottom-nav md:pb-8' : ''}`}>
          {/* Context Breadcrumbs on Desktop */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-xs text-slate-400 mb-5 font-medium">
            <span className="text-slate-500 font-bold">UniFest</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-semibold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-slate-200/60">
              {activeUser.role}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-primary font-bold">{getTabLabel(activeTab)}</span>
          </nav>

          <AnimatedTabPanel tabKey={activeTab}>
            {isStudent ? (
              <>
                {activeTab === 'dashboard' && (
                  <StudentDashboard
                    user={activeUser}
                    onOpenQrModal={() => setShowQrModal(true)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}
                {activeTab === 'events' && <EventsBrowser />}
                {activeTab === 'qr' && (
                  <div className="text-center py-8">
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="px-6 py-3 rounded-2xl bg-primary text-white font-heading font-bold text-sm shadow-xl hover:bg-primary-dark transition-all btn-tap"
                    >
                      Click to View Full-Screen QR Pass
                    </button>
                  </div>
                )}
                {activeTab === 'meals' && (
                  <MealsView user={activeUser} onOpenQrModal={() => setShowQrModal(true)} />
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </AnimatedTabPanel>
        </main>

        {/* QR Modal for Student */}
        {isStudent && (
          <MyQrModal
            isOpen={showQrModal || activeTab === 'qr'}
            onClose={() => {
              setShowQrModal(false);
              if (activeTab === 'qr') setActiveTab('dashboard');
            }}
            user={activeUser}
          />
        )}

        {/* Mobile QR Floating Action Button (Student only, mobile only) */}
        {isStudent && activeTab !== 'qr' && (
          <button
            onClick={() => setShowQrModal(true)}
            className="fab-qr md:hidden"
            aria-label="Show QR Pass"
          >
            <QrCode className="w-6 h-6" />
          </button>
        )}

        {/* Footer */}
        <footer className={`border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 ${isStudent ? 'hidden md:block' : ''}`}>
          <p className="font-semibold text-slate-500">
            UniFest Manager 2026 · Inter-College Sports & Folk Festival Operations Platform
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Guaranteed constraint-first accommodation (BR-1 to BR-5) · Single QR token identity · Targeted real-time alerts
          </p>
        </footer>
      </div>
    </ToastProvider>
  );
}
