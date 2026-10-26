'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  Bell,
  Trash2,
} from 'lucide-react';
import { Event } from '@unifest/shared';
import { useToast } from '@/components/ui/Toast';

export function EventManagerView() {
  const toast = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // New Event Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'SPORTS' | 'FOLK'>('SPORTS');
  const [newVenue, setNewVenue] = useState('');
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newEndsAt, setNewEndsAt] = useState('');
  const [newCapacity, setNewCapacity] = useState('24');
  const [newDescription, setNewDescription] = useState('');

  // Edit Event Modal
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editVenue, setEditVenue] = useState('');
  const [editStartsAt, setEditStartsAt] = useState('');
  const [editEndsAt, setEditEndsAt] = useState('');
  const [editReason, setEditReason] = useState('');
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          venue: newVenue,
          startsAt: new Date(newStartsAt).toISOString(),
          endsAt: new Date(newEndsAt).toISOString(),
          capacity: parseInt(newCapacity, 10),
          description: newDescription,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        loadEvents();
        toast.success('Event Created!', `"${newTitle}" is now live for student registrations.`);
      } else {
        const d = await res.json();
        toast.error('Creation Failed', d.error || 'Could not create the event.');
      }
    } catch {
      toast.error('Network Error', 'Unable to reach the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = async (evt: Event) => {
    setEditingEvent(evt);
    setEditVenue(evt.venue);
    // Format for datetime-local input
    setEditStartsAt(new Date(evt.startsAt).toISOString().slice(0, 16));
    setEditEndsAt(new Date(evt.endsAt).toISOString().slice(0, 16));
    setEditReason('');
    setRegisteredCount(evt.registrationsCount || 0);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue: editVenue,
          startsAt: new Date(editStartsAt).toISOString(),
          endsAt: new Date(editEndsAt).toISOString(),
          reason: editReason || 'Schedule adjustment by committee',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingEvent(null);
        loadEvents();
        if (data.notificationSummary?.studentsNotified) {
          toast.success(
            'Schedule Updated & Alerts Sent',
            `Real-time notifications pushed to ${data.notificationSummary.studentsNotified} registered students.`
          );
        } else {
          toast.success('Event Updated', 'Schedule changes saved successfully.');
        }
      } else {
        toast.error('Update Failed', data.error || 'Could not update event.');
      }
    } catch {
      toast.error('Network Error', 'Unable to reach the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900">Event Management & Scheduling</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify event times, change venues, and trigger targeted alerts to registered participants.
          </p>
        </div>

        <button
          onClick={() => {
            const now = new Date();
            setNewStartsAt(new Date(now.getTime() + 7200000).toISOString().slice(0, 16));
            setNewEndsAt(new Date(now.getTime() + 14400000).toISOString().slice(0, 16));
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Event
        </button>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading events catalog...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Timing</th>
                <th className="py-3 px-4">Registrations</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <Calendar className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No Events Scheduled Yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Use the "Create New Event" button above to schedule festival sports tournaments or cultural competitions.
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{evt.title}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          evt.type === 'SPORTS'
                            ? 'bg-sports/10 text-sports dark:text-teal-700'
                            : 'bg-folk/10 text-folk-dark'
                        }`}
                      >
                        {evt.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs">{evt.venue}</td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(evt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(evt.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {evt.registrationsCount || 0}
                        {evt.capacity ? ` / ${evt.capacity}` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(evt)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-primary hover:bg-primary/10 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit / Move
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Event Modal with Real-time Alert Warning */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900">
                  Update Event Schedule
                </h3>
                <p className="text-xs text-slate-500">{editingEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Targeted Notification Alert (BR-9) */}
            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-indigo-950">
              <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Targeted Real-time Broadcast:</span>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Any change to venue or time will trigger immediate notifications to all{' '}
                  <strong className="text-primary">{registeredCount} registered students</strong> for this event, and a global alert to managers.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue Location</label>
              <input
                type="text"
                value={editVenue}
                onChange={(e) => setEditVenue(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={editStartsAt}
                  onChange={(e) => setEditStartsAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={editEndsAt}
                  onChange={(e) => setEditEndsAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Change (Audited)</label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g., Rain forecast, pitch maintenance..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Pushing Updates...' : 'Publish & Alert Students'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateEvent}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                Create Festival Event
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Classical Kathak Solo"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="SPORTS">Sports Championship</option>
                  <option value="FOLK">Folk / Cultural Event</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue</label>
              <input
                type="text"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
                placeholder="e.g., Main Auditorium Hall"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Starts At</label>
                <input
                  type="datetime-local"
                  value={newStartsAt}
                  onChange={(e) => setNewStartsAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ends At</label>
                <input
                  type="datetime-local"
                  value={newEndsAt}
                  onChange={(e) => setNewEndsAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description & Rules</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                placeholder="Brief event overview, equipment requirements, rules..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
