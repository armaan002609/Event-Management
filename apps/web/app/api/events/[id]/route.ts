import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { emitDomainNotification } from '@/lib/notification-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = readDatabase();
  let event = db.events.find((e) => e.id === params.id);

  // Fallback to Supabase if event not found locally
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
      console.warn('Supabase event fetch error:', e);
    }
  }

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Combine registrations from local DB and Supabase
  const regMap = new Map<string, any>();
  for (const r of db.registrations.filter((r) => r.eventId === params.id && r.status === 'CONFIRMED')) {
    regMap.set(r.userId, r);
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
          if (!regMap.has(uid)) {
            regMap.set(uid, {
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
    console.warn('Supabase registrations query error:', err);
  }

  // Map user details
  const registeredUsers = Array.from(regMap.values()).map((r) => {
    const user = db.users.find((u) => u.id === r.userId);
    const col = db.colleges.find((c) => c.id === user?.collegeId);
    return {
      id: user?.id || r.userId,
      name: user?.name || 'Registered Participant',
      email: user?.email || '',
      phone: user?.phone || '',
      rollNo: user?.rollNo || 'N/A',
      college: col ? { id: col.id, code: col.code, name: col.name, color: col.color } : null,
      gender: user?.gender || 'N/A',
      registeredAt: r.createdAt || new Date().toISOString(),
      status: r.status,
    };
  });

  return NextResponse.json({
    event,
    registrationsCount: registeredUsers.length,
    registeredUsers,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const updates = await req.json();
    const db = readDatabase();
    const index = db.events.findIndex((e) => e.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const before = { ...db.events[index] };
    const changes: string[] = [];

    if (updates.venue && updates.venue !== before.venue) {
      changes.push(`Venue moved from "${before.venue}" to "${updates.venue}"`);
    }
    if (updates.startsAt && updates.startsAt !== before.startsAt) {
      changes.push(`Start time changed from ${new Date(before.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(updates.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }
    if (updates.status && updates.status !== before.status) {
      changes.push(`Status updated to ${updates.status}`);
    }

    db.events[index] = {
      ...before,
      ...updates,
    };

    // Audit Log
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId: activeUser.id,
      actorName: activeUser.name,
      action: updates.status === 'CANCELLED' ? 'EVENT_CANCEL' : 'EVENT_UPDATE',
      entity: 'Event',
      entityId: params.id,
      reason: updates.reason || changes.join('; ') || 'Event schedule updated by manager.',
      before: before as unknown as Record<string, unknown>,
      after: db.events[index] as unknown as Record<string, unknown>,
      at: new Date().toISOString(),
    });

    writeDatabase(db);

    // Emit domain event if time, venue or status changed
    let notificationSummary = { studentsNotified: 0, managersNotified: 0 };
    if (changes.length > 0) {
      const eventType = updates.status === 'CANCELLED' ? 'EVENT_CANCELLED' : 'EVENT_UPDATED';
      notificationSummary = emitDomainNotification(
        eventType,
        {
          eventId: params.id,
          title: db.events[index].title,
          changes,
          message: changes.join('\n'),
        },
        activeUser.name
      );
    }

    return NextResponse.json({
      event: db.events[index],
      changes,
      notificationSummary,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Only managers and admins can delete events.' }, { status: 403 });
  }

  const db = readDatabase();
  const eventIndex = db.events.findIndex((e) => e.id === params.id);
  let eventTitle = eventIndex !== -1 ? db.events[eventIndex].title : params.id;
  let deletedEvent = eventIndex !== -1 ? { ...db.events[eventIndex] } : null;

  // 1. Delete from Supabase
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      if (!deletedEvent) {
        const { data: sbEvt } = await sb.from('events').select('*').eq('id', params.id).single();
        if (sbEvt) {
          eventTitle = sbEvt.title;
          deletedEvent = sbEvt;
        }
      }
      // Delete registrations first
      await sb.from('registrations').delete().eq('event_id', params.id);
      // Delete event
      await sb.from('events').delete().eq('id', params.id);
    }
  } catch (err) {
    console.warn('Supabase event deletion error:', err);
  }

  // 2. Delete from local database
  if (eventIndex !== -1) {
    db.events.splice(eventIndex, 1);
  }
  db.registrations = db.registrations.filter((r) => r.eventId !== params.id);

  // 3. Audit log
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    actorId: activeUser.id,
    actorName: activeUser.name,
    action: 'EVENT_DELETE',
    entity: 'Event',
    entityId: params.id,
    reason: `Event "${eventTitle}" permanently deleted by ${activeUser.role} ${activeUser.name}`,
    before: deletedEvent as unknown as Record<string, unknown>,
    after: null,
    at: new Date().toISOString(),
  });

  writeDatabase(db);

  // 4. Notify any registered students of cancellation
  try {
    emitDomainNotification(
      'EVENT_CANCELLED',
      {
        eventId: params.id,
        title: eventTitle,
        subject: `[Event Cancelled] ${eventTitle}`,
        message: `The competition "${eventTitle}" has been cancelled and removed from the festival schedule.`,
      },
      activeUser.name
    );
  } catch (notifErr) {
    console.warn('Notification emission error on event delete:', notifErr);
  }

  return NextResponse.json({
    success: true,
    message: `Event "${eventTitle}" deleted successfully.`,
    deletedId: params.id,
  });
}
