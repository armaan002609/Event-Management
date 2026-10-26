import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';
import { AllocationMatrixHostel } from '@unifest/shared';

export async function GET() {
  const db = readDatabase();

  const allocatedUserIds = new Set(db.allocations.map((a) => a.userId));
  const unallocatedStudents = db.users
    .filter((u) => u.role === 'STUDENT' && !allocatedUserIds.has(u.id))
    .map((u) => {
      const col = db.colleges.find((c) => c.id === u.collegeId);
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
  for (const chk of db.checkinLogs) {
    if (!checkinsMap.has(chk.userId)) {
      checkinsMap.set(chk.userId, chk.type === 'CHECK_IN');
    }
  }

  // Build matrix grouped by Hostel -> Floor -> Room -> Bed
  const matrix: AllocationMatrixHostel[] = db.hostels.map((hostel) => {
    const hostelRooms = db.rooms.filter((r) => r.hostelId === hostel.id);
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
          const roomBeds = db.beds.filter((b) => b.roomId === room.id);
          const lockedCol = db.colleges.find((c) => c.id === room.lockedCollegeId);

          const matrixBeds = roomBeds.map((bed) => {
            const alloc = db.allocations.find((a) => a.bedId === bed.id);
            let allocData = null;
            if (alloc) {
              const user = db.users.find((u) => u.id === alloc.userId);
              const userCol = db.colleges.find((c) => c.id === user?.collegeId);
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

  const totalBeds = db.beds.length;
  const occupiedBeds = db.allocations.length;
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
