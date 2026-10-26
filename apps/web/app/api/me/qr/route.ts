import { NextRequest, NextResponse } from 'next/server';
import { getOptionalActiveUserAsync, getActiveUser } from '@/lib/auth';
import { generateQrToken } from '@/lib/qr-service';
import { readDatabase, writeDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = readDatabase();
  let activeUser = await getOptionalActiveUserAsync();

  // Allow explicit userId query param for modal or testing
  const queryUserId = req.nextUrl.searchParams.get('userId');
  if (queryUserId) {
    let target = db.users.find((u) => u.id === queryUserId);
    if (!target) {
      try {
        const { supabaseGetUserById } = await import('@/lib/supabase');
        const sbUser = await supabaseGetUserById(queryUserId);
        if (sbUser) {
          const existingIdx = db.users.findIndex((u) => u.id === sbUser.id);
          if (existingIdx >= 0) {
            db.users[existingIdx] = sbUser;
          } else {
            db.users.push(sbUser);
          }
          writeDatabase(db);
          target = sbUser;
        }
      } catch {}
    }
    if (target) {
      activeUser = target;
    }
  }

  if (!activeUser) {
    activeUser = getActiveUser();
  }

  // Derive origin so phone camera scanning directly navigates to verification pass
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  const college = db.colleges.find((c) => c.id === activeUser.collegeId);
  const { token, qrDataUrl, verifyUrl } = await generateQrToken(activeUser.id, origin);

  // Get last scan info
  const userScans = db.scanLogs
    .filter((s) => s.userId === activeUser.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const lastScan = userScans[0] || null;

  // Fetch live room & floor allocation info so student pass displays it immediately
  let allocation = db.allocations.find((a) => a.userId === activeUser.id);
  if (!allocation) {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sbClient = getSupabase();
      if (sbClient) {
        const { data: sbAlloc } = await sbClient
          .from('allocations')
          .select('*')
          .eq('user_id', activeUser.id)
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
        }
      }
    } catch {}
  }

  let bed: any = allocation ? db.beds.find((b) => b.id === allocation.bedId) : null;
  let room: any = bed ? db.rooms.find((r) => r.id === bed.roomId) : null;
  let hostel: any = room ? db.hostels.find((h) => h.id === room.hostelId) : null;

  if (allocation && (!bed || !room || !hostel)) {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sbClient = getSupabase();
      if (sbClient) {
        if (!bed) {
          const { data: bData } = await sbClient.from('beds').select('*').eq('id', allocation.bedId).maybeSingle();
          if (bData) bed = { id: bData.id, roomId: bData.room_id, label: bData.label };
        }
        if (bed && !room) {
          const { data: rData } = await sbClient.from('rooms').select('*').eq('id', bed.roomId).maybeSingle();
          if (rData) room = { id: rData.id, hostelId: rData.hostel_id, number: rData.number, floor: rData.floor, capacity: rData.capacity, gender: rData.gender };
        }
        if (room && !hostel) {
          const { data: hData } = await sbClient.from('hostels').select('*').eq('id', room.hostelId).maybeSingle();
          if (hData) hostel = { id: hData.id, name: hData.name, gender: hData.gender, collegeName: hData.college_name };
        }
      }
    } catch {}
  }

  const checkins = db.checkinLogs
    .filter((c) => c.userId === activeUser.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const isCheckedIn = checkins.length > 0 && checkins[0].type === 'CHECK_IN';

  const roomInfo = hostel ? {
    hostelName: hostel.name,
    roomNumber: room?.number,
    floor: typeof room?.floor === 'number' ? room.floor : 1,
    bedLabel: bed?.label,
    isCheckedIn,
  } : null;

  return NextResponse.json({
    token,
    qrDataUrl,
    verifyUrl,
    user: {
      id: activeUser.id,
      name: activeUser.name,
      gender: activeUser.gender,
      collegeCode: college?.code || 'N/A',
      collegeName: activeUser.collegeName || college?.name || 'Unknown',
      collegeColor: college?.color || '#3B3FD9',
    },
    roomInfo,
    lastScan,
  });
}
