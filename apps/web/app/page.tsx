'use client';

import React, { useState, useEffect } from 'react';
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
import { User } from '@unifest/shared';

export default function HomePage() {
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
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-heading font-bold text-slate-800 text-sm">Launching UniFest Manager...</p>
        </div>
      </div>
    );
  }

  const isStudent = activeUser.role === 'STUDENT';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Global Navbar */}
      <Navbar
        activeUser={activeUser}
        onUserSwitched={handleUserSwitched}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
                  className="px-6 py-3 rounded-2xl bg-primary text-white font-heading font-bold text-sm shadow-xl hover:bg-primary-dark transition-all"
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-500">
          UniFest Manager 2026 · Inter-College Sports & Folk Festival Operations Platform
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Guaranteed constraint-first accommodation (BR-1 to BR-5) · Single QR token identity · Targeted real-time alerts
        </p>
      </footer>
    </div>
  );
}
