import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase } from '@/lib/db';
import { Event } from '@unifest/shared';

export async function GET(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'ADMIN' && activeUser.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = readDatabase();
  const eventIdFilter = req.nextUrl.searchParams.get('eventId');

  // Collect events
  let allEvents: Event[] = [...db.events];
  const regMap = new Map<string, any>();

  // Local registrations
  for (const r of db.registrations) {
    if (r.status === 'CONFIRMED') {
      regMap.set(`${r.userId}-${r.eventId}`, r);
    }
  }

  // Combined users map
  const userMap = new Map<string, any>();
  for (const u of db.users) userMap.set(u.id, u);

  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      const [{ data: sbEvents }, { data: sbRegs }, { data: sbUsers }] = await Promise.all([
        sb.from('events').select('*'),
        sb.from('registrations').select('*'),
        sb.from('users').select('*'),
      ]);

      if (sbUsers && sbUsers.length > 0) {
        for (const su of sbUsers) {
          if (!userMap.has(su.id)) {
            userMap.set(su.id, {
              id: su.id,
              name: su.name,
              email: su.email,
              phone: su.phone,
              rollNo: su.roll_no || su.rollNo,
              gender: su.gender,
              collegeId: su.college_id || su.collegeId,
              role: su.role,
            });
          }
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

      if (sbRegs) {
        for (const sr of sbRegs) {
          const uid = sr.user_id || sr.userId;
          const eid = sr.event_id || sr.eventId;
          if (uid && eid && (sr.status === 'CONFIRMED' || !sr.status)) {
            regMap.set(`${uid}-${eid}`, {
              id: sr.id,
              userId: uid,
              eventId: eid,
              status: sr.status || 'CONFIRMED',
              createdAt: sr.created_at || sr.createdAt,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Supabase fetch error in /api/admin/events/registrations:', err);
  }

  const allRegistrations = Array.from(regMap.values());

  // Filter events if requested
  const targetEvents = eventIdFilter && eventIdFilter !== 'ALL'
    ? allEvents.filter((e) => e.id === eventIdFilter)
    : allEvents;

  // Build events with detailed participants
  const eventsWithParticipants = targetEvents.map((evt) => {
    const eventRegs = allRegistrations.filter((r) => r.eventId === evt.id);
    const participants = eventRegs.map((r) => {
      const user = userMap.get(r.userId);
      const col = db.colleges.find((c) => c.id === user?.collegeId);
      return {
        id: user?.id || r.userId,
        name: user?.name || 'Registered Student',
        email: user?.email || '',
        phone: user?.phone || '',
        rollNo: user?.rollNo || 'N/A',
        gender: user?.gender || 'N/A',
        college: col ? { id: col.id, code: col.code, name: col.name, color: col.color } : null,
        registeredAt: r.createdAt || new Date().toISOString(),
        status: r.status,
      };
    });

    return {
      ...evt,
      registrationsCount: participants.length,
      participants,
    };
  });

  const uniqueStudentIds = new Set(allRegistrations.map((r) => r.userId));

  return NextResponse.json({
    events: eventsWithParticipants,
    stats: {
      totalRegistrations: allRegistrations.length,
      totalEvents: allEvents.length,
      uniqueStudentsCount: uniqueStudentIds.size,
    },
  });
}
