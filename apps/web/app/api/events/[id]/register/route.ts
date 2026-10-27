import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { emitDomainNotification } from '@/lib/notification-service';
import { isUserProfileComplete, Event } from '@unifest/shared';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Only students can register for events' }, { status: 403 });
  }

  // REQUIREMENT: Must complete profile before event registration
  if (!isUserProfileComplete(activeUser)) {
    return NextResponse.json(
      {
        error: 'PROFILE_INCOMPLETE',
        message: 'Please complete your profile details (Father phone, address, college, roll no, course) before registering for events.',
      },
      { status: 400 }
    );
  }

  const db = readDatabase();
  let event: Event | undefined = db.events.find((e) => e.id === params.id);

  // If not found in local db, query Supabase
  if (!event) {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      if (sb) {
        const { data: sbEvt } = await sb.from('events').select('*').eq('id', params.id).single();
        if (sbEvt) {
          event = {
            id: sbEvt.id,
            title: sbEvt.title,
            type: sbEvt.type,
            description: sbEvt.description,
            venue: sbEvt.venue,
            startsAt: sbEvt.starts_at || sbEvt.startsAt,
            endsAt: sbEvt.ends_at || sbEvt.endsAt,
            capacity: sbEvt.capacity,
            status: sbEvt.status || 'SCHEDULED',
          };
          db.events.push(event);
        }
      }
    } catch (e) {
      console.warn('Supabase event query error:', e);
    }
  }

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Gather existing registrations across both local DB and Supabase
  const existingRegMap = new Map<string, any>();
  for (const r of db.registrations.filter((r) => r.eventId === params.id && r.status === 'CONFIRMED')) {
    existingRegMap.set(r.userId, r);
  }

  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      const { data: sbRegs } = await sb
        .from('registrations')
        .select('*')
        .eq('event_id', params.id)
        .eq('status', 'CONFIRMED');

      if (sbRegs) {
        for (const sr of sbRegs) {
          const uid = sr.user_id || sr.userId;
          if (!existingRegMap.has(uid)) {
            existingRegMap.set(uid, {
              id: sr.id,
              userId: uid,
              eventId: sr.event_id || sr.eventId,
              status: sr.status,
              createdAt: sr.created_at || sr.createdAt,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Supabase registration check warning:', err);
  }

  // Check if user is already confirmed
  if (existingRegMap.has(activeUser.id)) {
    return NextResponse.json({ success: true, message: 'Already registered for this event.' });
  }

  // Check capacity
  if (event.capacity && existingRegMap.size >= event.capacity) {
    return NextResponse.json({ error: 'This event has reached full capacity.' }, { status: 400 });
  }

  const regId = `reg-${Date.now()}-${activeUser.id.slice(-4)}`;
  const now = new Date().toISOString();

  // 1. Update Local In-Memory / JSON DB
  const localExisting = db.registrations.find((r) => r.eventId === params.id && r.userId === activeUser.id);
  if (localExisting) {
    localExisting.status = 'CONFIRMED';
  } else {
    db.registrations.push({
      id: regId,
      userId: activeUser.id,
      eventId: params.id,
      status: 'CONFIRMED',
      createdAt: now,
    });
  }

  // 2. Persist to Supabase registrations table
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      await sb.from('registrations').upsert({
        id: regId,
        user_id: activeUser.id,
        event_id: params.id,
        status: 'CONFIRMED',
        created_at: now,
      });
    }
  } catch (sbErr) {
    console.warn('Failed to persist registration to Supabase:', sbErr);
  }

  // 3. Create Immutable Audit Log
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    actorId: activeUser.id,
    actorName: activeUser.name,
    action: 'EVENT_REGISTRATION',
    entity: 'Event',
    entityId: params.id,
    reason: `Student ${activeUser.name} registered for ${event.title}`,
    before: null,
    after: {
      eventId: params.id,
      userId: activeUser.id,
      studentName: activeUser.name,
      college: activeUser.college?.name || 'N/A',
      eventTitle: event.title,
      status: 'CONFIRMED',
    },
    at: now,
  });

  // 4. Persist database state
  writeDatabase(db);

  // 5. Send Confirmation Notification to Student and Live Alert to Admins & Managers
  const currentCount = existingRegMap.size + 1;
  const timingFormatted = new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  emitDomainNotification(
    'EVENT_REGISTRATION',
    {
      eventId: params.id,
      userId: activeUser.id,
      title: event.title,
      subject: `Registration Confirmed: ${event.title}`,
      message: `${activeUser.name} (${activeUser.college?.name || 'College'}, Roll: ${activeUser.rollNo || 'N/A'}) registered for ${event.title}. Venue: ${event.venue}, Time: ${timingFormatted}. Total participants: ${currentCount}${event.capacity ? ` / ${event.capacity}` : ''}.`,
    },
    activeUser.name
  );

  return NextResponse.json({
    success: true,
    message: `Successfully registered for ${event.title}`,
    registrationsCount: currentCount,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const activeUser = getActiveUser();
  const db = readDatabase();
  const event = db.events.find((e) => e.id === params.id);

  const regIndex = db.registrations.findIndex(
    (r) => r.eventId === params.id && r.userId === activeUser.id
  );

  if (regIndex !== -1) {
    db.registrations.splice(regIndex, 1);
  }

  // Delete from Supabase registrations
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      await sb.from('registrations').delete().eq('event_id', params.id).eq('user_id', activeUser.id);
    }
  } catch (err) {
    console.warn('Failed to delete registration from Supabase:', err);
  }

  // Audit Log
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    actorId: activeUser.id,
    actorName: activeUser.name,
    action: 'EVENT_CANCEL',
    entity: 'Event',
    entityId: params.id,
    reason: `Student ${activeUser.name} cancelled registration for ${event?.title || params.id}`,
    before: { eventId: params.id, userId: activeUser.id },
    after: null,
    at: new Date().toISOString(),
  });

  writeDatabase(db);

  return NextResponse.json({ success: true, message: 'Registration cancelled.' });
}
