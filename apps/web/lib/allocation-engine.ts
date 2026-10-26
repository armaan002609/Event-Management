import {
  AllocationRunResult,
  AllocationShortfall,
  Gender,
  RoomAllocation,
  AuditLog,
  NotificationLog,
} from '@unifest/shared';
import { readDatabase, writeDatabase } from './db';

export function runAllocationAlgorithm(dryRun: boolean = false, actorId: string = 'SYSTEM'): AllocationRunResult {
  const db = readDatabase();

  // 1. Find all unallocated students who are verified
  const allocatedUserIds = new Set(db.allocations.map((a) => a.userId));
  const occupiedBedIds = new Set(db.allocations.map((a) => a.bedId));

  const unallocatedStudents = db.users.filter(
    (u) => u.role === 'STUDENT' && u.emailVerified && !allocatedUserIds.has(u.id) && u.collegeId
  );

  const totalUnallocatedInitial = unallocatedStudents.length;

  // 2. Partition into groups G[(collegeId, gender)]
  const groupsMap = new Map<string, { collegeId: string; gender: Gender; students: typeof unallocatedStudents }>();

  for (const student of unallocatedStudents) {
    const key = `${student.collegeId}_${student.gender}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, { collegeId: student.collegeId!, gender: student.gender, students: [] });
    }
    groupsMap.get(key)!.students.push(student);
  }

  // 3. Sort groups by size DESC
  const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => b.students.length - a.students.length);

  // Prepare working state of rooms and beds
  // Track occupancy and locked college
  const roomState = new Map<
    string,
    {
      room: (typeof db.rooms)[0];
      freeBedIds: string[];
      occupiedCount: number;
      lockedCollegeId: string | null;
    }
  >();

  for (const room of db.rooms) {
    const roomBeds = db.beds.filter((b) => b.roomId === room.id);
    const freeBeds = roomBeds.filter((b) => !occupiedBedIds.has(b.id)).map((b) => b.id);
    const occupiedCount = roomBeds.length - freeBeds.length;

    roomState.set(room.id, {
      room,
      freeBedIds: [...freeBeds],
      occupiedCount,
      lockedCollegeId: occupiedCount > 0 ? (room.lockedCollegeId ?? null) : null,
    });
  }

  const proposedAllocations: Array<{
    userId: string;
    userName: string;
    collegeCode: string;
    gender: Gender;
    bedId: string;
    hostelName: string;
    roomNumber: string;
    bedLabel: string;
  }> = [];

  const shortfalls: AllocationShortfall[] = [];

  // 4. Process each group
  for (const group of sortedGroups) {
    const college = db.colleges.find((c) => c.id === group.collegeId);
    const collegeCode = college?.code || 'UNKNOWN';
    const collegeName = college?.name || 'Unknown College';

    let remainingStudents = [...group.students];
    const initialGroupCount = remainingStudents.length;

    // Find candidate rooms: room.gender == group.gender AND (lockedCollegeId == group.collegeId OR lockedCollegeId == null)
    const candidates = Array.from(roomState.values()).filter(
      (rs) =>
        rs.room.gender === group.gender &&
        rs.freeBedIds.length > 0 &&
        (rs.lockedCollegeId === group.collegeId || rs.lockedCollegeId === null)
    );

    // PRIORITY 1: Top up partially filled rooms already locked to this college
    const partialRooms = candidates
      .filter((rs) => rs.lockedCollegeId === group.collegeId && rs.occupiedCount > 0)
      .sort((a, b) => b.freeBedIds.length - a.freeBedIds.length);

    for (const rs of partialRooms) {
      while (rs.freeBedIds.length > 0 && remainingStudents.length > 0) {
        const bedId = rs.freeBedIds.shift()!;
        const student = remainingStudents.shift()!;
        rs.occupiedCount++;

        const bed = db.beds.find((b) => b.id === bedId);
        const hostel = db.hostels.find((h) => h.id === rs.room.hostelId);

        proposedAllocations.push({
          userId: student.id,
          userName: student.name,
          collegeCode,
          gender: group.gender,
          bedId,
          hostelName: hostel?.name || 'Hostel',
          roomNumber: rs.room.number,
          bedLabel: bed?.label || 'Bed',
        });
      }
      if (remainingStudents.length === 0) break;
    }

    // PRIORITY 2: Use empty rooms (best fit: smallest capacity that fits remainder, or largest)
    if (remainingStudents.length > 0) {
      const emptyRooms = candidates
        .filter((rs) => rs.occupiedCount === 0)
        .sort((a, b) => {
          // If room capacity can fit the remainder, choose smallest capacity to avoid wasting big rooms
          const aFits = a.freeBedIds.length >= remainingStudents.length;
          const bFits = b.freeBedIds.length >= remainingStudents.length;
          if (aFits && bFits) return a.freeBedIds.length - b.freeBedIds.length;
          if (aFits) return -1;
          if (bFits) return 1;
          // Otherwise pick largest room first
          return b.freeBedIds.length - a.freeBedIds.length;
        });

      for (const rs of emptyRooms) {
        // Lock room to this college
        rs.lockedCollegeId = group.collegeId;

        while (rs.freeBedIds.length > 0 && remainingStudents.length > 0) {
          const bedId = rs.freeBedIds.shift()!;
          const student = remainingStudents.shift()!;
          rs.occupiedCount++;

          const bed = db.beds.find((b) => b.id === bedId);
          const hostel = db.hostels.find((h) => h.id === rs.room.hostelId);

          proposedAllocations.push({
            userId: student.id,
            userName: student.name,
            collegeCode,
            gender: group.gender,
            bedId,
            hostelName: hostel?.name || 'Hostel',
            roomNumber: rs.room.number,
            bedLabel: bed?.label || 'Bed',
          });
        }
        if (remainingStudents.length === 0) break;
      }
    }

    // If still have remaining unallocated students -> CAPACITY SHORTFALL!
    if (remainingStudents.length > 0) {
      shortfalls.push({
        collegeId: group.collegeId,
        collegeCode,
        collegeName,
        gender: group.gender,
        requested: initialGroupCount,
        allocated: initialGroupCount - remainingStudents.length,
        shortfall: remainingStudents.length,
      });
    }
  }

  // If not dry run, persist to database
  if (!dryRun) {
    const newAllocations: RoomAllocation[] = proposedAllocations.map((p, idx) => ({
      id: `alloc-auto-${Date.now()}-${idx}`,
      userId: p.userId,
      bedId: p.bedId,
      allocatedBy: actorId,
      isOverride: false,
      createdAt: new Date().toISOString(),
    }));

    db.allocations.push(...newAllocations);

    // Update room lockedCollegeId in the persistent database
    for (const [roomId, rs] of roomState.entries()) {
      const room = db.rooms.find((r) => r.id === roomId);
      if (room) {
        room.lockedCollegeId = rs.lockedCollegeId;
      }
    }

    // Add Audit Log entry
    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      actorId,
      actorName: 'System / Manager',
      action: 'ALLOCATION_RUN',
      entity: 'HOSTEL_ALLOCATION',
      entityId: `run-${Date.now()}`,
      reason: `Batch auto-allocation completed: ${proposedAllocations.length} students allocated.`,
      before: { previouslyAllocated: allocatedUserIds.size },
      after: {
        nowAllocated: db.allocations.length,
        newAllocations: proposedAllocations.length,
        shortfallsCount: shortfalls.length,
      },
      at: new Date().toISOString(),
    };
    db.auditLogs.unshift(auditEntry);

    // Create notifications for newly allocated students
    for (const p of proposedAllocations) {
      const student = db.users.find((u) => u.id === p.userId);
      if (student) {
        const notif: NotificationLog = {
          id: `notif-alloc-${Date.now()}-${p.userId}`,
          userId: student.id,
          userEmail: student.email,
          userName: student.name,
          type: 'ROOM_ALLOCATED',
          subject: `Room Allocated: ${p.hostelName} - Room ${p.roomNumber}, ${p.bedLabel}`,
          body: `Congratulations ${student.name}! Your festival accommodation has been allocated in ${p.hostelName}, Room ${p.roomNumber} (${p.bedLabel}). Check-in using your QR code at the reception.`,
          status: 'SENT',
          attempts: 1,
          createdAt: new Date().toISOString(),
        };
        db.notificationLogs.unshift(notif);
      }
    }

    // If shortfalls exist, create alert notification for all managers
    if (shortfalls.length > 0) {
      const managers = db.users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');
      for (const m of managers) {
        const notif: NotificationLog = {
          id: `notif-shortfall-${Date.now()}-${m.id}`,
          userId: m.id,
          userEmail: m.email,
          userName: m.name,
          type: 'CAPACITY_SHORTFALL',
          subject: `URGENT: Capacity Shortfall for ${shortfalls.length} college groups`,
          body: shortfalls
            .map((s) => `${s.collegeCode} (${s.gender}): ${s.shortfall} beds short (requested: ${s.requested})`)
            .join('; '),
          status: 'SENT',
          attempts: 1,
          createdAt: new Date().toISOString(),
        };
        db.notificationLogs.unshift(notif);
      }
    }

    writeDatabase(db);
  }

  return {
    dryRun,
    totalUnallocatedInitial,
    allocatedCount: proposedAllocations.length,
    unallocatedCount: totalUnallocatedInitial - proposedAllocations.length,
    shortfalls,
    allocations: proposedAllocations,
  };
}

export function overrideStudentAllocation(params: {
  userId: string;
  targetBedId: string;
  actorId: string;
  reason: string;
  forceException?: boolean;
}): { success: boolean; message: string; allocation?: RoomAllocation } {
  const { userId, targetBedId, actorId, reason, forceException } = params;

  if (!reason || reason.trim().length === 0) {
    return { success: false, message: 'A mandatory reason must be provided for all manual overrides.' };
  }

  const db = readDatabase();
  const actor = db.users.find((u) => u.id === actorId);
  const student = db.users.find((u) => u.id === userId);

  if (!student) {
    return { success: false, message: 'Student user not found.' };
  }

  const targetBed = db.beds.find((b) => b.id === targetBedId);
  if (!targetBed) {
    return { success: false, message: 'Target bed not found.' };
  }

  const targetRoom = db.rooms.find((r) => r.id === targetBed.roomId);
  if (!targetRoom) {
    return { success: false, message: 'Target room not found.' };
  }

  // Check if target bed is already occupied by someone else
  const currentOccupant = db.allocations.find((a) => a.bedId === targetBedId && a.userId !== userId);
  if (currentOccupant) {
    return { success: false, message: 'Target bed is already occupied.' };
  }

  // Safety checks BR-1 & BR-2:
  const isGenderMatch = student.gender === targetRoom.gender;
  const isCollegeMatch =
    targetRoom.lockedCollegeId === null || targetRoom.lockedCollegeId === student.collegeId;

  if (!isGenderMatch) {
    if (!forceException || actor?.role !== 'ADMIN') {
      return {
        success: false,
        message: `Safety violation (BR-1): Cannot place a ${student.gender} student into a ${targetRoom.gender} room without Admin explicit exception.`,
      };
    }
  }

  if (!isCollegeMatch) {
    const lockedCollege = db.colleges.find((c) => c.id === targetRoom.lockedCollegeId);
    if (!forceException || actor?.role !== 'ADMIN') {
      return {
        success: false,
        message: `Safety violation (BR-2): Room ${targetRoom.number} is locked to ${lockedCollege?.name || lockedCollege?.code}. Cannot place student from different college.`,
      };
    }
  }

  // Find existing allocation
  const existingIndex = db.allocations.findIndex((a) => a.userId === userId);
  const oldAllocation = existingIndex >= 0 ? { ...db.allocations[existingIndex] } : null;

  // If old allocation existed, find previous room
  if (oldAllocation) {
    const oldBed = db.beds.find((b) => b.id === oldAllocation.bedId);
    if (oldBed) {
      const oldRoom = db.rooms.find((r) => r.id === oldBed.roomId);
      // Remove old allocation
      db.allocations.splice(existingIndex, 1);

      // Check if old room is now empty
      if (oldRoom) {
        const remainingInOldRoom = db.allocations.filter((a) => {
          const bed = db.beds.find((b) => b.id === a.bedId);
          return bed?.roomId === oldRoom.id;
        });
        if (remainingInOldRoom.length === 0) {
          // BR-3: clear lockedCollegeId when room is empty
          oldRoom.lockedCollegeId = null;
        }
      }
    }
  }

  // Create new allocation
  const newAllocation: RoomAllocation = {
    id: `alloc-override-${Date.now()}`,
    userId,
    bedId: targetBedId,
    allocatedBy: actorId,
    isOverride: true,
    reason,
    createdAt: new Date().toISOString(),
  };

  db.allocations.push(newAllocation);

  // Lock target room to student's college if not already locked
  if (student.collegeId) {
    targetRoom.lockedCollegeId = student.collegeId;
  }

  // Write immutable AuditLog entry (BR-10)
  const auditEntry: AuditLog = {
    id: `audit-override-${Date.now()}`,
    actorId,
    actorName: actor?.name || actorId,
    action: 'ALLOCATION_OVERRIDE',
    entity: 'RoomAllocation',
    entityId: newAllocation.id,
    reason,
    before: oldAllocation ? (oldAllocation as unknown as Record<string, unknown>) : null,
    after: {
      userId,
      studentName: student.name,
      collegeId: student.collegeId,
      gender: student.gender,
      bedId: targetBedId,
      roomNumber: targetRoom.number,
      forceException: !!forceException,
    },
    at: new Date().toISOString(),
  };
  db.auditLogs.unshift(auditEntry);

  writeDatabase(db);

  return {
    success: true,
    message: `Student ${student.name} successfully moved to Room ${targetRoom.number}, ${targetBed.label}.`,
    allocation: newAllocation,
  };
}
