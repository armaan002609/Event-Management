import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase } from '@/lib/db';
import { Event } from '@unifest/shared';

export async function GET(req: NextRequest) {
  const activeUser = getActiveUser();
  const requestedUserId = req.nextUrl.searchParams.get('userId') || activeUser.id;
  const db = readDatabase();

  const userRegIds = new Set<string>();

  // 1. Local registrations
  for (const r of db.registrations) {
    if (r.userId === requestedUserId && r.status === 'CONFIRMED') {
      userRegIds.add(r.eventId);
    }
  }

  // 2. Supabase registrations
  let allEvents: Event[] = [...db.events];
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      const [{ data: sbRegs }, { data: sbEvents }] = await Promise.all([
        sb.from('registrations').select('*').eq('user_id', requestedUserId).eq('status', 'CONFIRMED'),
        sb.from('events').select('*'),
      ]);

      if (sbRegs) {
        for (const sr of sbRegs) {
          const eid = sr.event_id || sr.eventId;
          if (eid) userRegIds.add(eid);
        }
      }

      if (sbEvents && sbEvents.length > 0) {
        const mapped = sbEvents.map((e: any) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          description: e.description,
          venue: e.venue,
          startsAt: e.starts_at || e.startsAt,
          endsAt: e.ends_at || e.endsAt,
          capacity: e.capacity,
          status: e.status || 'SCHEDULED',
        }));
        const evMap = new Map();
        for (const e of allEvents) evMap.set(e.id, e);
        for (const e of mapped) evMap.set(e.id, e);
        allEvents = Array.from(evMap.values());
      }
    }
  } catch (e) {
    console.warn('Supabase query error in /api/me/schedule:', e);
  }

  const registeredEvents = allEvents
    .filter((e) => userRegIds.has(e.id))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  // Check for time conflicts between registered events
  const conflicts: Array<{ eventId1: string; eventId2: string; message: string }> = [];
  for (let i = 0; i < registeredEvents.length; i++) {
    for (let j = i + 1; j < registeredEvents.length; j++) {
      const e1 = registeredEvents[i];
      const e2 = registeredEvents[j];
      const s1 = new Date(e1.startsAt).getTime();
      const end1 = new Date(e1.endsAt).getTime();
      const s2 = new Date(e2.startsAt).getTime();
      const end2 = new Date(e2.endsAt).getTime();

      // Check if intervals overlap
      if (s1 < end2 && s2 < end1) {
        conflicts.push({
          eventId1: e1.id,
          eventId2: e2.id,
          message: `Overlap warning: "${e1.title}" conflicts with "${e2.title}"`,
        });
      }
    }
  }

  // Find next upcoming event
  const now = new Date().getTime();
  const upcomingEvents = registeredEvents.filter((e) => new Date(e.endsAt).getTime() > now);
  const nextUp = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  return NextResponse.json({
    schedule: registeredEvents,
    nextUp,
    conflicts,
  });
}
