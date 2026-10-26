import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser, getOptionalActiveUserAsync, isAdminUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { Hostel, Room, Bed, Gender, AuditLog } from '@unifest/shared';

export async function GET() {
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      const [
        { data: sbHostels },
        { data: sbRooms },
        { data: sbBeds },
        { data: sbAllocations },
        { data: sbColleges },
      ] = await Promise.all([
        sb.from('hostels').select('*'),
        sb.from('rooms').select('*'),
        sb.from('beds').select('*'),
        sb.from('allocations').select('*'),
        sb.from('colleges').select('*'),
      ]);

      if (sbHostels && sbHostels.length > 0) {
        const roomsList = sbRooms || [];
        const bedsList = sbBeds || [];
        const allocsList = sbAllocations || [];
        const colsList = sbColleges || [];

        const hostelsWithDetails = sbHostels.map((hostel: any) => {
          const rooms = roomsList.filter((r: any) => r.hostel_id === hostel.id);
          const roomsWithBeds = rooms.map((room: any) => {
            const beds = bedsList.filter((b: any) => b.room_id === room.id);
            const lockedCol = colsList.find((c: any) => c.id === room.locked_college_id);
            const occupiedCount = allocsList.filter((a: any) => beds.some((b: any) => b.id === a.bed_id)).length;

            return {
              id: room.id,
              hostelId: room.hostel_id,
              number: room.number,
              floor: room.floor,
              capacity: room.capacity,
              occupiedCount,
              lockedCollegeId: room.locked_college_id,
              lockedCollege: lockedCol,
              beds: beds.map((b: any) => ({
                id: b.id,
                roomId: b.room_id,
                label: b.label,
              })),
            };
          });

          const totalCapacity = rooms.reduce((acc: number, r: any) => acc + (r.capacity || 0), 0);
          const totalOccupied = roomsWithBeds.reduce((acc: number, r: any) => acc + r.occupiedCount, 0);

          return {
            id: hostel.id,
            name: hostel.name,
            gender: hostel.gender,
            roomsCount: rooms.length,
            totalCapacity,
            totalOccupied,
            vacantBeds: totalCapacity - totalOccupied,
            rooms: roomsWithBeds,
          };
        });

        return NextResponse.json(hostelsWithDetails);
      }
    }
  } catch {}

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
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
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
