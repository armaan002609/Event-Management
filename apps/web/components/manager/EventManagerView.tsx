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
  Download,
  Search,
  Sparkles,
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
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Event Participants Roster Modal
  const [selectedEventForRoster, setSelectedEventForRoster] = useState<Event | null>(null);
  const [rosterParticipants, setRosterParticipants] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');

  const filteredRoster = rosterParticipants.filter((p) => {
    if (!rosterSearch.trim()) return true;
    const q = rosterSearch.toLowerCase();
    const collegeName = typeof p.college === 'string' ? p.college : (p.college?.name || p.college?.code || '');
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.rollNo && p.rollNo.toLowerCase().includes(q)) ||
      collegeName.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    loadEvents();
    const handleUpdate = () => loadEvents();
    if (typeof window !== 'undefined') {
      window.addEventListener('unifest:event-registered', handleUpdate);
      window.addEventListener('unifest:event-unregistered', handleUpdate);
    }
    // Live polling every 5s so registrations reflect immediately on manager/admin screen
    const poll = setInterval(loadEvents, 5000);
    return () => {
      clearInterval(poll);
      if (typeof window !== 'undefined') {
        window.removeEventListener('unifest:event-registered', handleUpdate);
        window.removeEventListener('unifest:event-unregistered', handleUpdate);
      }
    };
  }, []);

  const loadEvents = () => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleOpenRoster = async (evt: Event) => {
    setSelectedEventForRoster(evt);
    setLoadingRoster(true);
    setRosterSearch('');
    try {
      const res = await fetch(`/api/events/${evt.id}`);
      const data = await res.json();
      if (res.ok && data.registeredUsers) {
        setRosterParticipants(data.registeredUsers);
      } else {
        setRosterParticipants([]);
      }
    } catch {
      setRosterParticipants([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleExportRosterCSV = () => {
    if (!selectedEventForRoster) return;
    const headers = ['Student Name', 'College', 'Roll Number', 'Gender', 'Email', 'Phone', 'Registered At', 'Status'];
    const rows = rosterParticipants.map((p) => [
      `"${p.name || ''}"`,
      `"${p.college?.name || p.college?.code || 'N/A'}"`,
      `"${p.rollNo || ''}"`,
      `"${p.gender || ''}"`,
      `"${p.email || ''}"`,
      `"${p.phone || ''}"`,
      `"${new Date(p.registeredAt).toLocaleString()}"`,
      `"${p.status || 'CONFIRMED'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEventForRoster.title.replace(/[^a-zA-Z0-9]/g, '_')}_Attendees.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Roster Exported', 'Attendee list CSV downloaded successfully.');
  };

  const handleDeleteEvent = async (evt: Event) => {
    if (!confirm(`Are you sure you want to permanently delete "${evt.title}"? This will cancel all student registrations for this competition.`)) {
      return;
    }
    setDeletingEventId(evt.id);
    try {
      const res = await fetch(`/api/events/${evt.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Event Deleted', `"${evt.title}" has been permanently removed.`);
        setEvents((prev) => prev.filter((e) => e.id !== evt.id));
        if (selectedEventForRoster?.id === evt.id) {
          setSelectedEventForRoster(null);
        }
        if (editingEvent?.id === evt.id) {
          setEditingEvent(null);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('unifest:event-unregistered'));
          window.dispatchEvent(new CustomEvent('unifest:event-deleted', { detail: { eventId: evt.id } }));
        }
      } else {
        toast.error('Deletion Failed', data.error || 'Failed to delete event');
      }
    } catch {
      toast.error('Network Error', 'Failed to delete event');
    } finally {
      setDeletingEventId(null);
    }
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
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-slate-100">Event Management & Scheduling</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading events catalog...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Timing</th>
                <th className="py-3 px-4">Registrations</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <Calendar className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No Events Scheduled Yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                      Use the "Create New Event" button above to schedule festival sports tournaments or cultural competitions.
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{evt.title}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          evt.type === 'SPORTS'
                            ? 'bg-sports/10 text-sports dark:text-teal-400 dark:bg-teal-500/10'
                            : 'bg-folk/10 text-folk-dark dark:text-orange-400 dark:bg-orange-500/10'
                        }`}
                      >
                        {evt.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 truncate max-w-xs">{evt.venue}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(evt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(evt.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenRoster(evt)}
                        className="font-semibold text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-teal-400 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                        title="Click to view registered participants"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary dark:group-hover:text-teal-400" />
                        <span>
                          {evt.registrationsCount || 0}
                          {evt.capacity ? ` / ${evt.capacity}` : ''}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenRoster(evt)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="View registered attendees list"
                        >
                          <Users className="w-3 h-3 text-slate-400" /> Attendees ({evt.registrationsCount || 0})
                        </button>
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-primary dark:text-teal-400 hover:bg-primary/10 dark:hover:bg-teal-500/10 text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt)}
                          disabled={deletingEventId === evt.id}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Permanently delete this event"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" /> {deletingEventId === evt.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Update Event Schedule
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{editingEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Targeted Notification Alert (BR-9) */}
            <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
              <Bell className="w-4 h-4 text-primary dark:text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Targeted Real-time Broadcast:</span>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-0.5">
                  Any change to venue or time will trigger immediate notifications to all{' '}
                  <strong className="text-primary dark:text-teal-400">{registeredCount} registered students</strong> for this event, and a global alert to managers.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Venue Location</label>
              <input
                type="text"
                value={editVenue}
                onChange={(e) => setEditVenue(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={editStartsAt}
                  onChange={(e) => setEditStartsAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={editEndsAt}
                  onChange={(e) => setEditEndsAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Change (Audited)</label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g., Rain forecast, pitch maintenance..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteEvent(editingEvent)}
                disabled={deletingEventId === editingEvent.id}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingEventId === editingEvent.id ? 'Deleting...' : 'Delete Event'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            </div>
          </form>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateEvent}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-slate-100">
                Create Festival Event
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Event Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Classical Kathak Solo"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="SPORTS">Sports Championship</option>
                  <option value="FOLK">Folk / Cultural Event</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Venue</label>
              <input
                type="text"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
                placeholder="e.g., Main Auditorium Hall"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Starts At</label>
                <input
                  type="datetime-local"
                  value={newStartsAt}
                  onChange={(e) => setNewStartsAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ends At</label>
                <input
                  type="datetime-local"
                  value={newEndsAt}
                  onChange={(e) => setNewEndsAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description & Rules</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                placeholder="Brief event overview, equipment requirements, rules..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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

      {/* Event Participants Roster Modal */}
      {selectedEventForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    {selectedEventForRoster.type}
                  </span>
                  <span className="text-xs text-slate-400">ID: {selectedEventForRoster.id}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {selectedEventForRoster.title} — Attendee Roster
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Venue: {selectedEventForRoster.venue} • Capacity: {selectedEventForRoster.capacity} • Live Registered: {rosterParticipants.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteEvent(selectedEventForRoster)}
                  disabled={deletingEventId === selectedEventForRoster.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors disabled:opacity-40"
                  title="Permanently delete this event competition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingEventId === selectedEventForRoster.id ? 'Deleting...' : 'Delete Event'}
                </button>
                <button
                  onClick={handleExportRosterCSV}
                  disabled={rosterParticipants.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-40"
                  title="Export attendee CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  onClick={() => setSelectedEventForRoster(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Filter attendees by name, roll no, college, or email..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Roster Table Content */}
            <div className="p-4 flex-1 overflow-y-auto">
              {loadingRoster ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-medium">Fetching registered attendees...</p>
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {rosterParticipants.length === 0
                      ? 'No students registered for this event yet'
                      : 'No attendees match your search query'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {rosterParticipants.length === 0
                      ? 'When students register via their portal, their name, college, and details will appear here immediately.'
                      : 'Try typing a different name or roll number.'}
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Roll / Reg No</th>
                        <th className="p-3">College / Dept</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Registered At</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {filteredRoster.map((user, idx) => (
                        <tr key={user.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div>{user.name || 'Anonymous Student'}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{user.email || 'No email'}</div>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            {user.rollNo || user.id || 'N/A'}
                          </td>
                          <td className="p-3 max-w-[160px] truncate" title={user.college || user.department}>
                            {user.college || user.department || 'Fest Participant'}
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400">
                            {user.phone || '—'}
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                            {user.registeredAt ? new Date(user.registeredAt).toLocaleString() : 'Recent'}
                          </td>
                          <td className="p-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              CONFIRMED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Showing {filteredRoster.length} of {rosterParticipants.length} registered students
              </span>
              <button
                onClick={() => setSelectedEventForRoster(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition-colors"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
