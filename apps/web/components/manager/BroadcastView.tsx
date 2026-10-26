'use client';

import React, { useState, useEffect } from 'react';
import { Send, Bell, Filter, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { NotificationLog, College, Event } from '@unifest/shared';
import { useToast } from '@/components/ui/Toast';

export function BroadcastView() {
  const toast = useToast();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [audienceType, setAudienceType] = useState<'ALL' | 'COLLEGE' | 'GENDER' | 'EVENT'>('ALL');
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, eventsRes, matrixRes] = await Promise.all([
        fetch('/api/notifications/logs').then((r) => r.json()),
        fetch('/api/events').then((r) => r.json()),
        fetch('/api/allocations/matrix').then((r) => r.json()),
      ]);

      if (Array.isArray(logsRes)) setLogs(logsRes);
      if (Array.isArray(eventsRes)) setEvents(eventsRes);

      fetch('/api/auth/me')
        .then((r) => r.json())
        .then((d) => {
          if (d.users) {
            // Extract unique colleges
            const colMap = new Map<string, College>();
            d.users.forEach((u: any) => {
              if (u.college) colMap.set(u.college.code, u.college);
            });
            setColleges(Array.from(colMap.values()));
          }
        });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSending(true);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audienceType,
          collegeId: selectedCollegeId || undefined,
          gender: selectedGender || undefined,
          eventId: selectedEventId || undefined,
          subject,
          message,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBroadcastResult(data.message);
        toast.success('Broadcast Sent', data.message || 'Notification sent successfully');
        setSubject('');
        setMessage('');
        loadData();
      } else {
        toast.error('Broadcast Failed', data.error || 'Failed to send broadcast');
      }
    } catch {
      toast.error('Network Error', 'Could not reach server to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-heading font-extrabold text-2xl text-slate-900">Notifications & Broadcasts</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Deliver targeted alerts to specific cohorts with delivery tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Send className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-sm text-slate-900">Compose Broadcast</h3>
          </div>

          {broadcastResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
              {broadcastResult}
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
              <select
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="ALL">All Registered Students</option>
                <option value="COLLEGE">Filter by College</option>
                <option value="GENDER">Filter by Gender</option>
                <option value="EVENT">Registrants of an Event</option>
              </select>
            </div>

            {audienceType === 'COLLEGE' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select College</label>
                <select
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">-- Choose College --</option>
                  <option value="col-pce">Punjab College of Engineering (PCE)</option>
                  <option value="col-lpu">Lovely Professional University (LPU)</option>
                  <option value="col-du">Delhi University (DU)</option>
                  <option value="col-iitd">IIT Delhi (IITD)</option>
                  <option value="col-bits">BITS Pilani (BITS)</option>
                </select>
              </div>
            )}

            {audienceType === 'GENDER' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Gender</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="MALE">Male Students Only</option>
                  <option value="FEMALE">Female Students Only</option>
                </select>
              </div>
            )}

            {audienceType === 'EVENT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">-- Choose Event --</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.registrationsCount || 0} registered)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Campus Bus Schedule for Evening Folk Gala"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write message to students..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </form>
        </div>

        {/* Outgoing Notification Logs Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-bold text-sm text-slate-900">Sent Notifications Feed</h3>
            </div>
            <span className="text-xs text-slate-400">{logs.length} logged</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No notifications sent yet.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.subject}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">{log.body}</p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>Recipient: {log.userName || log.userEmail || 'Cohort'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
