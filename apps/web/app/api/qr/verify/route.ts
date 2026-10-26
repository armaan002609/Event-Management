import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { FESTIVAL_ID, QrTicketPayload } from '@unifest/shared';
import { readDatabase, writeDatabase } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.QR_SECRET || 'unifest_secure_qr_secret_key_2026_super_safe');

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  let cleanToken = token.trim();
  if (cleanToken.includes('token=')) {
    try {
      const match = cleanToken.match(/token=([a-zA-Z0-9_\-\.]+)/);
      if (match && match[1]) {
        cleanToken = match[1];
      }
    } catch {}
  }

  try {
    const { payload } = await jwtVerify(cleanToken, JWT_SECRET);
    const typedPayload = payload as unknown as QrTicketPayload;

    if (typedPayload.fest !== FESTIVAL_ID) {
      return NextResponse.json({ error: 'Invalid festival credentials' }, { status: 400 });
    }

    const userId = typedPayload.sub;
    const db = readDatabase();

    let user = db.users.find((u) => u.id === userId);
    if (!user) {
      const { supabaseGetUserById } = await import('@/lib/supabase');
      const sbUser = await supabaseGetUserById(userId);
      if (sbUser) {
        db.users.push(sbUser);
        writeDatabase(db);
        user = sbUser;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const college = db.colleges.find((c) => c.id === user.collegeId);
    let allocation = db.allocations.find((a) => a.userId === user.id);
    if (!allocation) {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const sbClient = getSupabase();
        if (sbClient) {
          const { data: sbAlloc } = await sbClient
            .from('allocations')
            .select('*')
            .eq('user_id', user.id)
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

    // Check last check-in status
    const userCheckins = db.checkinLogs
      .filter((l) => l.userId === user.id)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const isCheckedIn = userCheckins.length > 0 && userCheckins[0].type === 'CHECK_IN';

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        gender: user.gender,
        role: user.role,
        avatarUrl: user.avatarUrl,
        collegeName: user.collegeName || college?.name || 'Unknown College',
        collegeCode: college?.code || 'PCE',
        fatherName: user.fatherName,
        course: user.course,
        passingYear: user.passingYear,
        rollNo: user.rollNo,
      },
      hostelInfo: hostel
        ? {
            hostelName: hostel.name,
            roomNumber: room?.number,
            floor: typeof room?.floor === 'number' ? room.floor : 1,
            bedLabel: bed?.label,
            isCheckedIn,
          }
        : null,
      issuedAt: typedPayload.iat ? new Date(typedPayload.iat * 1000).toISOString() : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Invalid, tampered, or expired QR pass', message: err?.message },
      { status: 400 }
    );
  }
}
