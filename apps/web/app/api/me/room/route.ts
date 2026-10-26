import { NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase } from '@/lib/db';

export async function GET() {
  const activeUser = getActiveUser();
  const db = readDatabase();

  const allocation = db.allocations.find((a) => a.userId === activeUser.id);
  if (!allocation) {
    return NextResponse.json({
      status: 'PENDING',
      message: 'Room allocation is pending or in progress.',
    });
  }

  const bed = db.beds.find((b) => b.id === allocation.bedId);
  const room = db.rooms.find((r) => r.id === bed?.roomId);
  const hostel = db.hostels.find((h) => h.id === room?.hostelId);

  // Check-in state
  const checkins = db.checkinLogs
    .filter((c) => c.userId === activeUser.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const lastLog = checkins[0];
  const isCheckedIn = lastLog?.type === 'CHECK_IN';
  const isCheckedOut = lastLog?.type === 'CHECK_OUT';

  // Roommates (same room, excluding self)
  const roomBeds = db.beds.filter((b) => b.roomId === room?.id);
  const roomAllocations = db.allocations.filter((a) =>
    roomBeds.some((b) => b.id === a.bedId && a.userId !== activeUser.id)
  );

  const roommates = roomAllocations.map((a) => {
    const rmUser = db.users.find((u) => u.id === a.userId);
    const rmBed = db.beds.find((b) => b.id === a.bedId);
    return {
      name: rmUser?.name,
      bedLabel: rmBed?.label,
    };
  });

  return NextResponse.json({
    status: isCheckedIn ? 'CHECKED_IN' : isCheckedOut ? 'CHECKED_OUT' : 'ALLOCATED',
    hostelName: hostel?.name,
    roomNumber: room?.number,
    floor: room?.floor,
    bedLabel: bed?.label,
    capacity: room?.capacity,
    gender: room?.gender,
    lastCheckinTime: lastLog ? lastLog.at : null,
    roommates,
  });
}
