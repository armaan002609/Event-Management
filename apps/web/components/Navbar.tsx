'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Trophy,
  Sparkles,
  QrCode,
  Bell,
  RefreshCw,
  User as UserIcon,
  ChevronDown,
  Shield,
  Layers,
  Utensils,
  Calendar,
  Home,
  CheckCircle2,
  X,
  AlertTriangle,
  LayoutDashboard,
  Radio,
  FileText,
  LogOut,
  LogIn,
} from 'lucide-react';
import { User, NotificationLog, isUserProfileComplete } from '@unifest/shared';

interface NavbarProps {
  activeUser: User | null;
  onUserSwitched: (user: User) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfileModal?: () => void;
}

export function Navbar({ activeUser, onUserSwitched, activeTab, setActiveTab, onOpenProfileModal }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  useEffect(() => {
    loadNotifications();
  }, [activeUser?.id]);

  const loadNotifications = () => {
    fetch('/api/notifications/logs')
      .then((r) => r.json())
      .then((logs) => {
        if (Array.isArray(logs)) setNotifications(logs);
      })
      .catch(() => {});
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setShowUserDropdown(false);
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const isScannerRoute = pathname === '/scanner';

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowUserDropdown(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                  <Trophy className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-extrabold text-lg text-slate-900 tracking-tight">
                      Uni<span className="text-primary">Fest</span>
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      2026
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                    Sports & Folk Events Portal
                  </p>
                </div>
              </Link>
            </div>

            {/* Navigation Tabs (desktop only) */}
            {!isScannerRoute && activeUser && (
              <nav className="hidden md:flex items-center space-x-1">
                {activeUser.role === 'STUDENT' ? (
                  <>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'dashboard'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Home className="w-4 h-4" /> Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('events')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'events'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" /> Events & Schedule
                    </button>
                    <button
                      onClick={() => setActiveTab('qr')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'qr'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <QrCode className="w-4 h-4" /> My QR Pass
                    </button>
                    <button
                      onClick={() => setActiveTab('meals')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'meals'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Utensils className="w-4 h-4" /> Meals
                    </button>
                  </>
                ) : (
                  <>
                    {activeUser.role === 'ADMIN' && (
                      <button
                        onClick={() => setActiveTab('admin-center')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                          activeTab === 'admin-center'
                            ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                            : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                        }`}
                      >
                        <Shield className="w-4 h-4" /> Admin Center
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'overview'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Home className="w-4 h-4" /> Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('allocation-matrix')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'allocation-matrix'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="w-4 h-4" /> Hostel Matrix
                    </button>
                    <button
                      onClick={() => setActiveTab('event-manager')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'event-manager'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Calendar className="w-4 h-4" /> Event Manager
                    </button>
                    <button
                      onClick={() => setActiveTab('meals-live')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'meals-live'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Utensils className="w-4 h-4" /> Mess Board
                    </button>
                    <button
                      onClick={() => setActiveTab('broadcast')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'broadcast'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Bell className="w-4 h-4" /> Alerts
                    </button>
                    <button
                      onClick={() => setActiveTab('audit')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        activeTab === 'audit'
                          ? 'bg-primary text-white shadow-sm shadow-primary/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Shield className="w-4 h-4" /> Audit Log
                    </button>
                  </>
                )}
              </nav>
            )}

            {/* Right Controls: Scanner shortcut, Notifications, Switch Role */}
            <div className="flex items-center gap-2.5">
              {/* Quick Scanner PWA button */}
              <Link
                href="/scanner"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scanner Mode</span>
              </Link>

              {/* Notification Bell */}
              <div className="relative" data-dropdown>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                    setShowUserDropdown(false);
                  }}
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Notifications Drawer Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 toast-enter">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        <h4 className="font-heading font-bold text-sm text-slate-900">Notifications & Alerts</h4>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        {notifications.length}
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto mt-2 space-y-2.5 divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div key={n.id} className="pt-2 text-xs">
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-bold text-slate-900 leading-snug">{n.subject}</span>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed line-clamp-2">{n.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile & Sign Out Dropdown */}
              {activeUser ? (
                <div className="relative" data-dropdown>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserDropdown(!showUserDropdown);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 transition-all text-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-[10px]">
                      {activeUser.name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                        {activeUser.name}
                      </p>
                      <p className="text-[10px] text-primary font-semibold leading-none">
                        {activeUser.role}
                        {activeUser.college ? ` · ${activeUser.college.code}` : ''}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 toast-enter space-y-3">
                      {/* User Info Header */}
                      <div className="pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                            {activeUser.name?.charAt(0) || 'U'}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-900 truncate">{activeUser.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{activeUser.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {activeUser.role}
                          </span>
                          {activeUser.college && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {activeUser.college.code}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        </div>
                      </div>

                      {/* Student Profile Action */}
                      {activeUser.role === 'STUDENT' && onOpenProfileModal && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenProfileModal();
                          }}
                          className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
                        >
                          <span className="flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-primary" />
                            <span>My Student Details</span>
                          </span>
                          {!isUserProfileComplete(activeUser) ? (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                              Incomplete
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                              Complete
                            </span>
                          )}
                        </button>
                      )}

                      {/* Sign Out Action */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MOBILE BOTTOM NAVIGATION BAR ═══ */}
      {/* Replaces the old scrollable sub-nav with a proper iOS/Android-style fixed bottom bar */}
      {!isScannerRoute && activeUser && (
        <nav className="bottom-nav md:hidden">
          <div className="flex items-stretch h-full">
            {activeUser.role === 'STUDENT' ? (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`bottom-nav-item ${activeTab === 'events' ? 'active' : ''}`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Events</span>
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`bottom-nav-item ${activeTab === 'qr' ? 'active' : ''}`}
                >
                  <QrCode className="w-5 h-5" />
                  <span>QR Pass</span>
                </button>
                <button
                  onClick={() => setActiveTab('meals')}
                  className={`bottom-nav-item ${activeTab === 'meals' ? 'active' : ''}`}
                >
                  <Utensils className="w-5 h-5" />
                  <span>Meals</span>
                </button>
              </>
            ) : (
              <>
                {activeUser.role === 'ADMIN' && (
                  <button
                    onClick={() => setActiveTab('admin-center')}
                    className={`bottom-nav-item ${activeTab === 'admin-center' ? 'active' : ''}`}
                    style={activeTab === 'admin-center' ? { color: '#E11D48' } : {}}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`bottom-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('allocation-matrix')}
                  className={`bottom-nav-item ${activeTab === 'allocation-matrix' ? 'active' : ''}`}
                >
                  <Layers className="w-5 h-5" />
                  <span>Hostels</span>
                </button>
                <button
                  onClick={() => setActiveTab('event-manager')}
                  className={`bottom-nav-item ${activeTab === 'event-manager' ? 'active' : ''}`}
                >
                  <Calendar className="w-5 h-5" />
                  <span>Events</span>
                </button>
                <button
                  onClick={() => setActiveTab('meals-live')}
                  className={`bottom-nav-item ${activeTab === 'meals-live' ? 'active' : ''}`}
                >
                  <Utensils className="w-5 h-5" />
                  <span>Meals</span>
                </button>
              </>
            )}
          </div>
        </nav>
      )}

    </>
  );
}
