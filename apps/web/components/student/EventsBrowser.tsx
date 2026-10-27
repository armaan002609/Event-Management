'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Music,
  MapPin,
  Clock,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { Event, User as UserType, isUserProfileComplete } from '@unifest/shared';
import { useToast } from '@/components/ui/Toast';
import { CompleteProfileModal } from '@/components/profile/CompleteProfileModal';

export function EventsBrowser() {
  const toast = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'SPORTS' | 'FOLK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actingEventId, setActingEventId] = useState<string | null>(null);

  // Profile completion gating modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(() => {});
  }, []);

  const loadEvents = () => {
    setLoading(true);
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const executeRegister = async (eventId: string) => {
    setActingEventId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'PROFILE_INCOMPLETE') {
          toast.warning('Profile Required', data.message || 'Please complete your profile details first.');
          setShowProfileModal(true);
          return;
        }
        toast.error('Registration Failed', data.error || 'Could not register for this event.');
      } else {
        // Optimistic state update
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, isRegistered: true, registrationsCount: (e.registrationsCount || 0) + 1 }
              : e
          )
        );
        // Celebration confetti burst! 🎉
        const evt = events.find((e) => e.id === eventId);
        toast.success('You\'re In! 🎉', `Successfully registered for ${evt?.title || 'the event'}.`);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#3B3FD9', '#6366F1', '#10B981', '#F59E0B'],
        });

        // Notify other components (Dashboard, Navbar) to refresh immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('unifest:event-registered', { detail: { eventId } }));
        }
      }
    } catch {
      toast.error('Network Error', 'Could not reach the server. Please try again.');
    } finally {
      setActingEventId(null);
    }
  };

  const handleRegister = (eventId: string) => {
    // REQUIREMENT: Must complete profile details first
    if (currentUser && !isUserProfileComplete(currentUser)) {
      setPendingEventId(eventId);
      const targetEvent = events.find((e) => e.id === eventId);
      toast.warning(
        'Profile Required',
        `Please complete your student profile details before registering for ${targetEvent?.title || 'events'}.`
      );
      setShowProfileModal(true);
      return;
    }

    executeRegister(eventId);
  };

  const handleProfileUpdated = (updatedUser: UserType) => {
    setCurrentUser(updatedUser);
    if (pendingEventId) {
      const targetId = pendingEventId;
      setPendingEventId(null);
      executeRegister(targetId);
    }
  };

  const handleWithdraw = async (eventId: string) => {
    if (!confirm('Withdraw your registration from this event?')) return;
    setActingEventId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, { method: 'DELETE' });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, isRegistered: false, registrationsCount: Math.max(0, (e.registrationsCount || 1) - 1) }
              : e
          )
        );
        toast.info('Registration Withdrawn', 'You have been removed from this event.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('unifest:event-unregistered', { detail: { eventId } }));
        }
      }
    } catch {
      toast.error('Network Error', 'Could not withdraw registration. Try again.');
    } finally {
      setActingEventId(null);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterType !== 'ALL' && e.type !== filterType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">Festival Events & Schedule</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Register for inter-college sports competitions and cultural folk performances.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType('SPORTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'SPORTS'
                ? 'bg-sports text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Sports
          </button>
          <button
            onClick={() => setFilterType('FOLK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'FOLK'
                ? 'bg-folk text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" /> Folk & Cultural
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by event title, sport, dance form, or venue..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
        />
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading festival schedule...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="font-heading font-bold text-slate-700 dark:text-slate-200 text-sm">No Events Found</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {filteredEvents.map((evt) => {
            const isFull = evt.capacity ? (evt.registrationsCount || 0) >= evt.capacity : false;
            const isActing = actingEventId === evt.id;
            const now = Date.now();
            const startsAtMs = new Date(evt.startsAt).getTime();
            const endsAtMs = new Date(evt.endsAt).getTime();
            const isLive = evt.status === 'LIVE' || (now >= startsAtMs && now <= endsAtMs);

            return (
              <div
                key={evt.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm card-hover-lift flex flex-col justify-between relative overflow-hidden transition-colors ${
                  evt.isRegistered ? 'registered-shimmer ring-1 ring-primary/20' : ''
                } ${isLive ? 'ring-2 ring-emerald-500/40' : ''}`}
              >
                {/* Top Accent Strip */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isLive ? 'bg-emerald-500 animate-pulse' : evt.type === 'SPORTS' ? 'bg-sports' : 'bg-folk'
                  }`}
                />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          evt.type === 'SPORTS'
                            ? 'bg-sports/10 text-sports dark:text-teal-400'
                            : 'bg-folk/10 text-folk-dark dark:text-amber-400'
                        }`}
                      >
                        {evt.type}
                      </span>
                      {isLive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 shadow-sm animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" /> LIVE NOW
                        </span>
                      )}
                    </div>

                    {evt.isRegistered && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white leading-snug">
                    {evt.title}
                  </h3>

                  {evt.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  )}

                  <div className="space-y-2 my-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {new Date(evt.startsAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' · '}
                        {new Date(evt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(evt.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">{evt.venue}</span>
                    </div>

                    {evt.capacity && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                            <Users className="w-3 h-3 text-slate-400" /> Seats Capacity
                          </span>
                          <span className={`font-bold ${isFull ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {evt.registrationsCount || 0} / {evt.capacity} {isFull ? '(Full)' : ''}
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull
                                ? 'bg-rose-500'
                                : (evt.registrationsCount || 0) / evt.capacity > 0.75
                                ? 'bg-amber-500'
                                : 'bg-primary'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.round(((evt.registrationsCount || 0) / evt.capacity) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {evt.status === 'SCHEDULED' ? 'Status: On Schedule' : evt.status}
                  </span>

                  {evt.isRegistered ? (
                    <button
                      onClick={() => handleWithdraw(evt.id)}
                      disabled={isActing}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isActing ? 'Updating...' : 'Withdraw'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(evt.id)}
                      disabled={isActing || isFull}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isFull
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-primary-dark active:scale-95 shadow-primary/20'
                      }`}
                    >
                      {isActing ? 'Registering...' : isFull ? 'Event Full' : 'Register Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Profile Modal for Event Registration Gating */}
      <CompleteProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setPendingEventId(null);
        }}
        user={currentUser}
        onProfileUpdated={handleProfileUpdated}
        reason="Required before registering for festival events"
      />
    </div>
  );
}
