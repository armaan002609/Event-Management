import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { Event } from '@unifest/shared';

export async function GET() {
  const activeUser = getActiveUser();
  const db = readDatabase();

  let eventsList = [...db.events];
  let regsList = [...db.registrations];

  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      const [{ data: sbEvents }, { data: sbRegs }] = await Promise.all([
        sb.from('events').select('*'),
        sb.from('registrations').select('*'),
      ]);

      if (sbEvents && sbEvents.length > 0) {
        const mappedSbEvents = sbEvents.map((e: any) => ({
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

        // Merge Supabase events with local db events
        const eventMap = new Map();
        for (const e of eventsList) eventMap.set(e.id, e);
        for (const e of mappedSbEvents) eventMap.set(e.id, e);
        eventsList = Array.from(eventMap.values());
      }

      if (sbRegs) {
        const mappedSbRegs = sbRegs.map((r: any) => ({
          id: r.id,
          userId: r.user_id || r.userId,
          eventId: r.event_id || r.eventId,
          status: r.status || 'CONFIRMED',
          createdAt: r.created_at || r.createdAt,
        }));

        // Merge Supabase registrations with local db registrations
        const regMap = new Map();
        for (const r of regsList) regMap.set(`${r.userId}-${r.eventId}`, r);
        for (const r of mappedSbRegs) regMap.set(`${r.userId}-${r.eventId}`, r);
        regsList = Array.from(regMap.values());
      }
    }
  } catch (err) {
    console.warn('Events route Supabase query error, fallback to local db:', err);
  }

  // Seed default festival events if fewer than 2 events exist
  if (eventsList.length < 2) {
    const defaultEvents: Event[] = [
      {
        id: 'evt-1',
        title: 'Inter-College 100m Sprint Men',
        type: 'SPORTS',
        description: 'Men sprint finals. Top 8 qualifiers from preliminary college heats.',
        venue: 'Main Athletics Track, Sector 4',
        startsAt: new Date(Date.now() + 2 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 3.5 * 3600000).toISOString(),
        capacity: 16,
        status: 'SCHEDULED',
      },
      {
        id: 'evt-2',
        title: 'Punjab Folk Bhangra Championship',
        type: 'FOLK',
        description: 'Traditional Folk Dance group competition. Live Dhol accompaniment.',
        venue: 'Open Air Amphitheatre',
        startsAt: new Date(Date.now() + 4 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 7 * 3600000).toISOString(),
        capacity: 30,
        status: 'SCHEDULED',
      },
      {
        id: 'evt-3',
        title: 'Badminton Singles Men & Women',
        type: 'SPORTS',
        description: 'Knockout tournament under BWF standard tournament rules.',
        venue: 'Indoor Badminton Arena, Court 1 & 2',
        startsAt: new Date(Date.now() + 24 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 28 * 3600000).toISOString(),
        capacity: 24,
        status: 'SCHEDULED',
      },
      {
        id: 'evt-4',
        title: 'Ghazal & Sufi Fusion Night',
        type: 'FOLK',
        description: 'Classical and contemporary Sufi vocal performances by college troupes.',
        venue: 'Central Auditorium Hall',
        startsAt: new Date(Date.now() + 29 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 33 * 3600000).toISOString(),
        capacity: 200,
        status: 'SCHEDULED',
      },
      {
        id: 'evt-5',
        title: 'Inter-College Football 7s',
        type: 'SPORTS',
        description: 'High-intensity 7-a-side football tournament.',
        venue: 'West Campus Sports Ground',
        startsAt: new Date(Date.now() + 48 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 54 * 3600000).toISOString(),
        capacity: 40,
        status: 'SCHEDULED',
      },
    ];

    const currentIds = new Set(eventsList.map((e) => e.id));
    for (const de of defaultEvents) {
      if (!currentIds.has(de.id)) {
        eventsList.push(de);
        db.events.push(de);
      }
    }
    writeDatabase(db);
  }

  const userRegs = new Set(
    regsList.filter((r) => r.userId === activeUser.id && r.status === 'CONFIRMED').map((r) => r.eventId)
  );

  const eventsWithStatus = eventsList.map((evt) => {
    const regCount = regsList.filter((r) => r.eventId === evt.id && r.status === 'CONFIRMED').length;
    return {
      ...evt,
      registrationsCount: regCount,
      isRegistered: userRegs.has(evt.id),
    };
  });

  return NextResponse.json(eventsWithStatus);
}

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only managers and admins can create events' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, type, description, venue, startsAt, endsAt, capacity } = body;

    if (!title || !type || !venue || !startsAt || !endsAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = readDatabase();
    const newEvent: Event = {
      id: `evt-${Date.now()}`,
      title,
      type,
      description: description || null,
      venue,
      startsAt,
      endsAt,
      capacity: capacity ? parseInt(capacity, 10) : null,
      status: 'SCHEDULED',
    };

    db.events.push(newEvent);

    // Audit log
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId: activeUser.id,
      actorName: activeUser.name,
      action: 'EVENT_CREATE',
      entity: 'Event',
      entityId: newEvent.id,
      reason: `Created new event: ${title}`,
      before: null,
      after: newEvent as unknown as Record<string, unknown>,
      at: new Date().toISOString(),
    });

    writeDatabase(db);

    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      if (sb) {
        await sb.from('events').insert({
          id: newEvent.id,
          title: newEvent.title,
          type: newEvent.type,
          description: newEvent.description,
          venue: newEvent.venue,
          starts_at: newEvent.startsAt,
          ends_at: newEvent.endsAt,
          capacity: newEvent.capacity,
          status: newEvent.status,
        });
      }
    } catch (e) {
      console.warn('Failed to insert event into Supabase:', e);
    }

    return NextResponse.json(newEvent);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
