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

      if (sbHostels) {
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
            collegeId: hostel.college_id || hostel.collegeId || null,
            collegeName: hostel.college_name || hostel.collegeName || null,
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
      collegeId: hostel.collegeId || null,
      collegeName: hostel.collegeName || null,
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
      const { name, gender, collegeId, collegeName } = body;
      if (!name || !gender) {
        return NextResponse.json({ error: 'Hostel name and gender (MALE/FEMALE) are required.' }, { status: 400 });
      }

      const newHostel: Hostel = {
        id: `hostel-${Date.now()}`,
        name,
        gender: gender as Gender,
        collegeId: collegeId || null,
        collegeName: collegeName || null,
      };

      try {
        const { getSupabase } = await import('@/lib/supabase');
        const sb = getSupabase();
        if (sb) {
          await sb.from('hostels').insert({
            id: newHostel.id,
            name: newHostel.name,
            gender: newHostel.gender,
            college_id: newHostel.collegeId,
            college_name: newHostel.collegeName,
          });
        }
      } catch (e) {
        console.warn('Supabase insert hostel error:', e);
      }

      db.hostels.push(newHostel);

      // Audit Log
      db.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        actorId: activeUser.id,
        actorName: activeUser.name,
        action: 'HOSTEL_CREATE',
        entity: 'Hostel',
        entityId: newHostel.id,
        reason: `Admin created new hostel facility: ${name} (${gender}) for ${collegeName || 'Campus'}`,
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

      let hostelGender: Gender = 'MALE';
      let hostelName = '';

      // Check DB or Supabase
      const hostel = db.hostels.find((h) => h.id === hostelId);
      if (hostel) {
        hostelGender = hostel.gender;
        hostelName = hostel.name;
      } else {
        try {
          const { getSupabase } = await import('@/lib/supabase');
          const sb = getSupabase();
          if (sb) {
            const { data } = await sb.from('hostels').select('*').eq('id', hostelId).single();
            if (data) {
              hostelGender = data.gender;
              hostelName = data.name;
            }
          }
        } catch {}
      }

      const capInt = parseInt(capacity, 10);
      const floorInt = floor ? parseInt(floor, 10) : 1;

      const newRoom: Room = {
        id: `room-${Date.now()}`,
        hostelId,
        number,
        floor: floorInt,
        capacity: capInt,
        gender: hostelGender,
        lockedCollegeId: null,
      };

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

      try {
        const { getSupabase } = await import('@/lib/supabase');
        const sb = getSupabase();
        if (sb) {
          await sb.from('rooms').insert({
            id: newRoom.id,
            hostel_id: newRoom.hostelId,
            number: newRoom.number,
            floor: newRoom.floor,
            capacity: newRoom.capacity,
            gender: newRoom.gender,
            locked_college_id: newRoom.lockedCollegeId,
          });
          if (newBeds.length > 0) {
            await sb.from('beds').insert(
              newBeds.map((b) => ({
                id: b.id,
                room_id: b.roomId,
                label: b.label,
              }))
            );
          }
        }
      } catch (e) {
        console.warn('Supabase insert room error:', e);
      }

      db.rooms.push(newRoom);
      db.beds.push(...newBeds);

      db.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        actorId: activeUser.id,
        actorName: activeUser.name,
        action: 'ROOM_CREATE',
        entity: 'Room',
        entityId: newRoom.id,
        reason: `Admin added Room ${number} to ${hostelName || 'hostel'} with ${capInt} beds.`,
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

export async function DELETE(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get('hostelId');
    const roomId = searchParams.get('roomId');

    if (!hostelId && !roomId) {
      return NextResponse.json({ error: 'hostelId or roomId is required.' }, { status: 400 });
    }

    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      if (sb) {
        if (roomId) {
          const { data: bList } = await sb.from('beds').select('id').eq('room_id', roomId);
          const bedIds = (bList || []).map((b: any) => b.id);
          if (bedIds.length > 0) {
            await sb.from('allocations').delete().in('bed_id', bedIds);
          }
          await sb.from('beds').delete().eq('room_id', roomId);
          await sb.from('rooms').delete().eq('id', roomId);
        } else if (hostelId) {
          const { data: rList } = await sb.from('rooms').select('id').eq('hostel_id', hostelId);
          const rIds = (rList || []).map((r: any) => r.id);
          if (rIds.length > 0) {
            const { data: bList } = await sb.from('beds').select('id').in('room_id', rIds);
            const bIds = (bList || []).map((b: any) => b.id);
            if (bIds.length > 0) {
              await sb.from('allocations').delete().in('bed_id', bIds);
              await sb.from('beds').delete().in('id', bIds);
            }
            await sb.from('rooms').delete().in('id', rIds);
          }
          await sb.from('hostels').delete().eq('id', hostelId);
        }
      }
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }

    const db = readDatabase();
    if (roomId) {
      const bedIds = db.beds.filter((b) => b.roomId === roomId).map((b) => b.id);
      db.allocations = db.allocations.filter((a) => !bedIds.includes(a.bedId));
      db.beds = db.beds.filter((b) => b.roomId !== roomId);
      db.rooms = db.rooms.filter((r) => r.id !== roomId);
    } else if (hostelId) {
      const rIds = db.rooms.filter((r) => r.hostelId === hostelId).map((r) => r.id);
      const bIds = db.beds.filter((b) => rIds.includes(b.roomId)).map((b) => b.id);
      db.allocations = db.allocations.filter((a) => !bIds.includes(a.bedId));
      db.beds = db.beds.filter((b) => !bIds.includes(b.id));
      db.rooms = db.rooms.filter((r) => !rIds.includes(r.id));
      db.hostels = db.hostels.filter((h) => h.id !== hostelId);
    }
    writeDatabase(db);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
