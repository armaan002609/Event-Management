import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { Hostel, Room, Bed, Gender, AuditLog } from '@unifest/shared';

export async function GET() {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const db = readDatabase();
  const hostelsWithDetails = db.hostels.map((hostel) => {
    const rooms = db.rooms.filter((r) => r.hostelId === hostel.id);
    const roomsWithBeds = rooms.map((room) => {
      const beds = db.beds.filter((b) => b.roomId === room.id);
      const lockedCol = db.colleges.find((c) => c.id === room.lockedCollegeId);
      const occupiedCount = db.allocations.filter((a) => beds.some((b) => b.id === a.bedId)).length;

      return {
        ...room,
        occupiedCount,
        lockedCollege: lockedCol,
        beds,
      };
    });

    const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
    const totalOccupied = roomsWithBeds.reduce((acc, r) => acc + r.occupiedCount, 0);

    return {
      ...hostel,
      roomsCount: rooms.length,
      totalCapacity,
      totalOccupied,
      vacantBeds: totalCapacity - totalOccupied,
      rooms: roomsWithBeds,
    };
  });

  return NextResponse.json(hostelsWithDetails);
}

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const db = readDatabase();

    if (action === 'ADD_HOSTEL') {
      const { name, gender } = body;
      if (!name || !gender) {
        return NextResponse.json({ error: 'Hostel name and gender (MALE/FEMALE) are required.' }, { status: 400 });
      }

      const newHostel: Hostel = {
        id: `hostel-${Date.now()}`,
        name,
        gender: gender as Gender,
      };

      db.hostels.push(newHostel);

      // Audit Log
      db.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        actorId: activeUser.id,
        actorName: activeUser.name,
        action: 'HOSTEL_CREATE',
        entity: 'Hostel',
        entityId: newHostel.id,
        reason: `Admin created new hostel facility: ${name} (${gender})`,
        before: null,
        after: newHostel as unknown as Record<string, unknown>,
        at: new Date().toISOString(),
      });

      writeDatabase(db);
      return NextResponse.json(newHostel);
    } else if (action === 'ADD_ROOM') {
      const { hostelId, number, floor, capacity } = body;
      if (!hostelId || !number || !capacity) {
        return NextResponse.json({ error: 'hostelId, room number, and capacity are required.' }, { status: 400 });
      }

      const hostel = db.hostels.find((h) => h.id === hostelId);
      if (!hostel) {
        return NextResponse.json({ error: 'Hostel not found' }, { status: 404 });
      }

      // Check duplicate room number in this hostel
      const existing = db.rooms.find((r) => r.hostelId === hostelId && r.number === number);
      if (existing) {
        return NextResponse.json({ error: `Room ${number} already exists in ${hostel.name}` }, { status: 400 });
      }

      const capInt = parseInt(capacity, 10);
      const floorInt = floor ? parseInt(floor, 10) : 1;

      const newRoom: Room = {
        id: `room-${Date.now()}`,
        hostelId,
        number,
        floor: floorInt,
        capacity: capInt,
        gender: hostel.gender, // BR-1: Inherited strictly from hostel gender
        lockedCollegeId: null,
      };

      db.rooms.push(newRoom);

      // Generate beds
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const newBeds: Bed[] = [];
      for (let i = 0; i < capInt; i++) {
        const bed: Bed = {
          id: `bed-${newRoom.id}-${i + 1}`,
          roomId: newRoom.id,
          label: `Bed ${labels[i] || i + 1}`,
        };
        newBeds.push(bed);
      }

      db.beds.push(...newBeds);

      // Audit Log
      db.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        actorId: activeUser.id,
        actorName: activeUser.name,
        action: 'ROOM_CREATE',
        entity: 'Room',
        entityId: newRoom.id,
        reason: `Admin added Room ${number} to ${hostel.name} with ${capInt} beds.`,
        before: null,
        after: { room: newRoom, bedsCount: newBeds.length },
        at: new Date().toISOString(),
      });

      writeDatabase(db);

      return NextResponse.json({ room: newRoom, beds: newBeds });
    }

    return NextResponse.json({ error: 'Invalid action. Must be ADD_HOSTEL or ADD_ROOM' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
