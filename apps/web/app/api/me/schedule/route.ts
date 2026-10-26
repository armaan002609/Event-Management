import { NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase } from '@/lib/db';

export async function GET() {
  const activeUser = getActiveUser();
  const db = readDatabase();

  const userRegs = db.registrations.filter(
    (r) => r.userId === activeUser.id && r.status === 'CONFIRMED'
  );
  const eventIds = new Set(userRegs.map((r) => r.eventId));

  const registeredEvents = db.events
    .filter((e) => eventIds.has(e.id))
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
