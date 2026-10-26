import { NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/db';

export async function POST() {
  const freshDb = resetDatabase();
  return NextResponse.json({
    success: true,
    message: 'UniFest platform reset and re-seeded with realistic sample colleges, hostels, events, and students.',
    stats: {
      collegesCount: freshDb.colleges.length,
      usersCount: freshDb.users.length,
      eventsCount: freshDb.events.length,
      hostelsCount: freshDb.hostels.length,
      roomsCount: freshDb.rooms.length,
      bedsCount: freshDb.beds.length,
    },
  });
}
