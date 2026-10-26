import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';
import { AllocationMatrixHostel } from '@unifest/shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = readDatabase();

  let hostels = db.hostels;
  let rooms = db.rooms;
  let beds = db.beds;
  let allocations = db.allocations;
  let colleges = db.colleges;
  let users = db.users;
  let checkinLogs = db.checkinLogs;

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
        { data: sbUsers },
        { data: sbCheckins },
      ] = await Promise.all([
        sb.from('hostels').select('*'),
        sb.from('rooms').select('*'),
        sb.from('beds').select('*'),
        sb.from('allocations').select('*'),
        sb.from('colleges').select('*'),
        sb.from('users').select('*'),
        sb.from('checkin_logs').select('*'),
      ]);

      if (sbHostels && sbHostels.length > 0) {
        hostels = sbHostels.map((h: any) => ({
          id: h.id,
          name: h.name,
          gender: h.gender,
          collegeId: h.college_id || h.collegeId || null,
          collegeName: h.college_name || h.collegeName || null,
        }));
      }

      if (sbRooms && sbRooms.length > 0) {
        rooms = sbRooms.map((r: any) => ({
          id: r.id,
          hostelId: r.hostel_id || r.hostelId,
          number: r.number,
          floor: r.floor,
          capacity: r.capacity,
          gender: r.gender,
          lockedCollegeId: r.locked_college_id || r.lockedCollegeId || null,
        }));
      }

      if (sbBeds && sbBeds.length > 0) {
        beds = sbBeds.map((b: any) => ({
          id: b.id,
          roomId: b.room_id || b.roomId,
          label: b.label,
        }));
      }

      if (sbAllocations) {
        allocations = sbAllocations.map((a: any) => ({
          id: a.id,
          bedId: a.bed_id || a.bedId,
          userId: a.user_id || a.userId,
          allocatedBy: a.allocated_by || a.allocatedBy || '',
          isOverride: Boolean(a.is_override ?? a.isOverride ?? false),
          reason: a.reason || null,
          createdAt: a.created_at || a.createdAt || new Date().toISOString(),
        }));
      }

      if (sbColleges && sbColleges.length > 0) {
        colleges = sbColleges.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          color: c.color,
        }));
      }

      if (sbUsers && sbUsers.length > 0) {
        users = sbUsers.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          phone: u.phone,
          gender: u.gender,
          role: u.role,
          collegeId: u.college_id || u.collegeId || null,
          collegeName: u.college_name || u.collegeName || null,
          emailVerified: u.email_verified ?? u.emailVerified ?? true,
          password: u.password || '',
        }));
      }

      if (sbCheckins) {
        checkinLogs = sbCheckins.map((chk: any) => ({
          id: chk.id,
          userId: chk.user_id || chk.userId,
          type: chk.type,
          scannedBy: chk.scanned_by || chk.scannedBy,
          at: chk.created_at || chk.at,
        }));
      }
    }
  } catch (err) {
    console.warn('Matrix route: Supabase query fallback to local db:', err);
  }

  const allocatedUserIds = new Set(allocations.map((a) => a.userId));
  const unallocatedStudents = users
    .filter((u) => u.role === 'STUDENT' && !allocatedUserIds.has(u.id))
    .map((u) => {
      const col = colleges.find((c) => c.id === u.collegeId);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        gender: u.gender,
        collegeId: u.collegeId,
        collegeCode: col?.code || 'N/A',
        collegeName: col?.name || 'Unknown',
        collegeColor: col?.color || '#3B3FD9',
      };
    });

  // Calculate shortfalls by (college, gender)
  const shortfallsMap = new Map<string, { collegeCode: string; gender: string; count: number }>();
  for (const student of unallocatedStudents) {
    const key = `${student.collegeCode}_${student.gender}`;
    if (!shortfallsMap.has(key)) {
      shortfallsMap.set(key, { collegeCode: student.collegeCode, gender: student.gender, count: 0 });
    }
    shortfallsMap.get(key)!.count++;
  }

  // Active checkin map
  const checkinsMap = new Map<string, boolean>();
  for (const chk of checkinLogs) {
    if (!checkinsMap.has(chk.userId)) {
      checkinsMap.set(chk.userId, chk.type === 'CHECK_IN');
    }
  }

  // Build matrix grouped by Hostel -> Floor -> Room -> Bed
  const matrix: AllocationMatrixHostel[] = hostels.map((hostel) => {
    const hostelRooms = rooms.filter((r) => r.hostelId === hostel.id);
    const floorsMap = new Map<number, typeof hostelRooms>();

    for (const room of hostelRooms) {
      if (!floorsMap.has(room.floor)) {
        floorsMap.set(room.floor, []);
      }
      floorsMap.get(room.floor)!.push(room);
    }

    const sortedFloors = Array.from(floorsMap.keys())
      .sort((a, b) => a - b)
      .map((floorNum) => {
        const roomsOnFloor = floorsMap.get(floorNum)!;
        const matrixRooms = roomsOnFloor.map((room) => {
          const roomBeds = beds.filter((b) => b.roomId === room.id);
          const lockedCol = colleges.find((c) => c.id === room.lockedCollegeId);

          const matrixBeds = roomBeds.map((bed) => {
            const alloc = allocations.find((a) => a.bedId === bed.id);
            let allocData = null;
            if (alloc) {
              const user = users.find((u) => u.id === alloc.userId);
              const userCol = colleges.find((c) => c.id === user?.collegeId);
              if (user) {
                allocData = {
                  id: alloc.id,
                  userId: user.id,
                  userName: user.name,
                  collegeId: user.collegeId || '',
                  collegeCode: userCol?.code || 'N/A',
                  collegeColor: userCol?.color || '#3B3FD9',
                  gender: user.gender,
                  checkedIn: !!checkinsMap.get(user.id),
                };
              }
            }

            return {
              id: bed.id,
              label: bed.label,
              allocation: allocData,
            };
          });

          return {
            id: room.id,
            number: room.number,
            floor: room.floor,
            capacity: room.capacity,
            gender: room.gender,
            lockedCollegeId: room.lockedCollegeId ?? null,
            lockedCollegeCode: lockedCol?.code || null,
            lockedCollegeName: lockedCol?.name || null,
            lockedCollegeColor: lockedCol?.color || null,
            isLocked: !!room.lockedCollegeId,
            beds: matrixBeds,
          };
        });

        return {
          floor: floorNum,
          rooms: matrixRooms,
        };
      });

    return {
      id: hostel.id,
      name: hostel.name,
      gender: hostel.gender,
      floors: sortedFloors,
    };
  });

  const totalBeds = beds.length;
  const occupiedBeds = allocations.length;
  const vacantBeds = totalBeds - occupiedBeds;

  return NextResponse.json({
    matrix,
    stats: {
      totalBeds,
      occupiedBeds,
      vacantBeds,
      unallocatedCount: unallocatedStudents.length,
      shortfalls: Array.from(shortfallsMap.values()),
    },
    unallocatedStudents,
  });
}
