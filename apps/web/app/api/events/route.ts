import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { Event } from '@unifest/shared';

export async function GET() {
  const activeUser = getActiveUser();
  const db = readDatabase();

  const userRegs = new Set(
    db.registrations.filter((r) => r.userId === activeUser.id && r.status === 'CONFIRMED').map((r) => r.eventId)
  );

  const eventsWithStatus = db.events.map((evt) => {
    const regCount = db.registrations.filter((r) => r.eventId === evt.id && r.status === 'CONFIRMED').length;
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

    return NextResponse.json(newEvent);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
