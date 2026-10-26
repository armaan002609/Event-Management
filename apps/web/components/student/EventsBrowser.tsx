'use client';

import React, { useState, useEffect } from 'react';
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
import { Event } from '@unifest/shared';

export function EventsBrowser() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'SPORTS' | 'FOLK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actingEventId, setActingEventId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
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

  const handleRegister = async (eventId: string) => {
    setActingEventId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to register');
      } else {
        // Optimistic state update
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, isRegistered: true, registrationsCount: (e.registrationsCount || 0) + 1 }
              : e
          )
        );
      }
    } catch {
      alert('Network error while registering');
    } finally {
      setActingEventId(null);
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
      }
    } catch {
      alert('Network error while withdrawing');
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
          <h2 className="font-heading font-extrabold text-2xl text-slate-900">Festival Events & Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register for inter-college sports competitions and cultural folk performances.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType('SPORTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'SPORTS'
                ? 'bg-sports text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Sports
          </button>
          <button
            onClick={() => setFilterType('FOLK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'FOLK'
                ? 'bg-folk text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Music className="w-3.5 h-3.5" /> Folk & Cultural
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by event title, sport, dance form, or venue..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading festival schedule...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-heading font-bold text-slate-700 text-sm">No Events Found</h4>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((evt) => {
            const isFull = evt.capacity ? (evt.registrationsCount || 0) >= evt.capacity : false;
            const isActing = actingEventId === evt.id;

            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Accent Strip */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    evt.type === 'SPORTS' ? 'bg-sports' : 'bg-folk'
                  }`}
                />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        evt.type === 'SPORTS'
                          ? 'bg-sports/10 text-sports dark:text-teal-700'
                          : 'bg-folk/10 text-folk-dark'
                      }`}
                    >
                      {evt.type}
                    </span>

                    {evt.isRegistered && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Registered
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 leading-snug">
                    {evt.title}
                  </h3>

                  {evt.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  )}

                  <div className="space-y-1.5 my-3 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(evt.startsAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' · '}
                        {new Date(evt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(evt.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>

                    {evt.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {evt.registrationsCount || 0} / {evt.capacity} seats filled
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400">
                    {evt.status === 'SCHEDULED' ? 'Status: On Schedule' : evt.status}
                  </span>

                  {evt.isRegistered ? (
                    <button
                      onClick={() => handleWithdraw(evt.id)}
                      disabled={isActing}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isActing ? 'Updating...' : 'Withdraw'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(evt.id)}
                      disabled={isActing || isFull}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
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
    </div>
  );
}
