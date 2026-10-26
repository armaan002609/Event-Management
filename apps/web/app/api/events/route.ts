import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { Event } from '@unifest/shared';

export async function GET() {
  const activeUser = getActiveUser();
  const db = readDatabase();

  let eventsList = db.events;
  let regsList = db.registrations;

  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      const [{ data: sbEvents }, { data: sbRegs }] = await Promise.all([
        sb.from('events').select('*'),
        sb.from('event_registrations').select('*'),
      ]);

      if (sbEvents) {
        eventsList = sbEvents.map((e: any) => ({
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
      }
      if (sbRegs) {
        regsList = sbRegs.map((r: any) => ({
          id: r.id,
          userId: r.user_id || r.userId,
          eventId: r.event_id || r.eventId,
          status: r.status,
        }));
      }
    }
  } catch (err) {
    console.warn('Events route Supabase query error, fallback to local db:', err);
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
