import { NextRequest, NextResponse } from 'next/server';
import { getOptionalActiveUserAsync, getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = readDatabase();
  let targetUser = await getOptionalActiveUserAsync();

  const queryUserId = req.nextUrl.searchParams.get('userId');
  if (queryUserId) {
    let u = db.users.find((usr) => usr.id === queryUserId);
    if (!u) {
      try {
        const { supabaseGetUserById } = await import('@/lib/supabase');
        const sbUser = await supabaseGetUserById(queryUserId);
        if (sbUser) u = sbUser;
      } catch {}
    }
    if (u) {
      targetUser = u;
    }
  }

  if (!targetUser) {
    targetUser = getActiveUser();
  }

  if (!targetUser) {
    return NextResponse.json({
      status: 'PENDING',
      message: 'No active student identified.',
    });
  }

  let allocation = db.allocations.find((a) => a.userId === targetUser.id);
  let sbClient: any = null;

  try {
    const { getSupabase } = await import('@/lib/supabase');
    sbClient = getSupabase();
    if (sbClient && !allocation) {
      const { data: sbAlloc } = await sbClient
        .from('allocations')
        .select('*')
        .eq('user_id', targetUser.id)
        .maybeSingle();

      if (sbAlloc) {
        allocation = {
          id: sbAlloc.id,
          userId: sbAlloc.user_id,
          bedId: sbAlloc.bed_id,
          allocatedBy: sbAlloc.allocated_by,
          isOverride: Boolean(sbAlloc.is_override),
          createdAt: sbAlloc.created_at,
        };
        db.allocations.push(allocation);
        writeDatabase(db);
      }
    }
  } catch (e) {
    console.warn('api/me/room error checking Supabase:', e);
  }

  if (!allocation) {
    return NextResponse.json({
      status: 'PENDING',
      message: 'Room allocation is pending or in progress.',
    });
  }

  let bed = db.beds.find((b) => b.id === allocation.bedId);
  let room = db.rooms.find((r) => r.id === bed?.roomId);
  let hostel = db.hostels.find((h) => h.id === room?.hostelId);

  if ((!bed || !room || !hostel) && sbClient) {
    try {
      if (!bed) {
        const { data: bData } = await sbClient.from('beds').select('*').eq('id', allocation.bedId).maybeSingle();
        if (bData) bed = { id: bData.id, roomId: bData.room_id, label: bData.label };
      }
      if (bed && !room) {
        const { data: rData } = await sbClient.from('rooms').select('*').eq('id', bed.roomId).maybeSingle();
        if (rData) room = { id: rData.id, hostelId: rData.hostel_id, number: rData.number, floor: rData.floor, capacity: rData.capacity, gender: rData.gender, lockedCollegeId: rData.locked_college_id };
      }
      if (room && !hostel) {
        const { data: hData } = await sbClient.from('hostels').select('*').eq('id', room.hostelId).maybeSingle();
        if (hData) hostel = { id: hData.id, name: hData.name, gender: hData.gender, collegeId: hData.college_id, collegeName: hData.college_name };
      }
    } catch {}
  }

  // Check-in state
  let checkins = db.checkinLogs
    .filter((c) => c.userId === targetUser.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  if (sbClient && checkins.length === 0) {
    try {
      const { data: sbCheckins } = await sbClient
        .from('checkin_logs')
        .select('*')
        .eq('user_id', targetUser.id)
        .order('at', { ascending: false });
      if (sbCheckins && sbCheckins.length > 0) {
        checkins = sbCheckins.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          type: c.type,
          scannedBy: c.scanned_by,
          at: c.at,
        }));
      }
    } catch {}
  }

  const lastLog = checkins[0];
  const isCheckedIn = lastLog?.type === 'CHECK_IN';
  const isCheckedOut = lastLog?.type === 'CHECK_OUT';

  // Roommates (same room, excluding self)
  const roomBeds = db.beds.filter((b) => b.roomId === room?.id);
  const roomAllocations = db.allocations.filter((a) =>
    roomBeds.some((b) => b.id === a.bedId && a.userId !== targetUser.id)
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
    floor: typeof room?.floor === 'number' ? room.floor : 1,
    bedLabel: bed?.label,
    capacity: room?.capacity || 5,
    gender: room?.gender,
    lastCheckinTime: lastLog ? lastLog.at : null,
    roommates,
  });
}
