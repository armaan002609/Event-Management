import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { emitDomainNotification } from '@/lib/notification-service';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Only students can register for events' }, { status: 403 });
  }

  const db = readDatabase();
  const event = db.events.find((e) => e.id === params.id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Check capacity
  if (event.capacity) {
    const currentRegs = db.registrations.filter((r) => r.eventId === params.id && r.status === 'CONFIRMED').length;
    if (currentRegs >= event.capacity) {
      return NextResponse.json({ error: 'This event has reached full capacity.' }, { status: 400 });
    }
  }

  // Check if already registered
  const existing = db.registrations.find((r) => r.eventId === params.id && r.userId === activeUser.id);
  if (existing) {
    if (existing.status === 'CONFIRMED') {
      return NextResponse.json({ message: 'Already registered' });
    }
    existing.status = 'CONFIRMED';
  } else {
    db.registrations.push({
      id: `reg-${Date.now()}`,
      userId: activeUser.id,
      eventId: params.id,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    });
  }

  // Send confirmation notification to registrant only (BR-9)
  emitDomainNotification(
    'EVENT_REGISTRATION',
    {
      eventId: params.id,
      userId: activeUser.id,
      title: event.title,
      subject: `Registration Confirmed: ${event.title}`,
      message: `You are officially confirmed for ${event.title}. Venue: ${event.venue}, Time: ${new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    },
    'UniFest System'
  );

  writeDatabase(db);

  return NextResponse.json({ success: true, message: `Successfully registered for ${event.title}` });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const activeUser = getActiveUser();
  const db = readDatabase();

  const regIndex = db.registrations.findIndex(
    (r) => r.eventId === params.id && r.userId === activeUser.id
  );

  if (regIndex === -1) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  db.registrations.splice(regIndex, 1);
  writeDatabase(db);

  return NextResponse.json({ success: true, message: 'Registration cancelled.' });
}
