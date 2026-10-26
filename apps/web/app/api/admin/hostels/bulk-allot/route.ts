import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser, getOptionalActiveUserAsync, isAdminUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { NORTH_INDIA_COLLEGES, Gender, RoomAllocation, AuditLog, College, User } from '@unifest/shared';

interface BulkStudentRow {
  rollNo?: string;
  name: string;
  gender: string;
  age?: string | number;
  collegeName: string;
  collegeCode?: string;
  city?: string;
  state?: string;
  course?: string;
  year?: string | number;
  activityCategory?: string;
  specificActivity?: string;
  email?: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const studentsInput: BulkStudentRow[] = body.students;

    if (!Array.isArray(studentsInput) || studentsInput.length === 0) {
      return NextResponse.json({ error: 'Invalid payload: students array is required.' }, { status: 400 });
    }

    // 1. Fetch current database state
    const db = readDatabase();
    let supabaseClient: any = null;
    let sbHostels: any[] = [];
    let sbRooms: any[] = [];
    let sbBeds: any[] = [];
    let sbAllocs: any[] = [];
    let sbColleges: any[] = [];
    let sbUsers: any[] = [];

    try {
      const { getSupabase } = await import('@/lib/supabase');
      supabaseClient = getSupabase();
      if (supabaseClient) {
        const [
          { data: hData },
          { data: rData },
          { data: bData },
          { data: aData },
          { data: cData },
          { data: uData },
        ] = await Promise.all([
          supabaseClient.from('hostels').select('*'),
          supabaseClient.from('rooms').select('*'),
          supabaseClient.from('beds').select('*'),
          supabaseClient.from('allocations').select('*'),
          supabaseClient.from('colleges').select('*'),
          supabaseClient.from('users').select('*'),
        ]);

        sbHostels = hData || [];
        sbRooms = rData || [];
        sbBeds = bData || [];
        sbAllocs = aData || [];
        sbColleges = cData || [];
        sbUsers = uData || [];
      }
    } catch (e) {
      console.warn('Failed to fetch from Supabase:', e);
    }

    // Unify state (prefer Supabase if available, fallback to db.json)
    const activeHostels = sbHostels.length > 0 ? sbHostels : db.hostels.map((h) => ({
      id: h.id,
      name: h.name,
      gender: h.gender,
      college_id: h.collegeId || null,
      college_name: h.collegeName || null,
    }));

    const activeRooms = sbRooms.length > 0 ? sbRooms : db.rooms.map((r) => ({
      id: r.id,
      hostel_id: r.hostelId,
      number: r.number,
      floor: r.floor,
      capacity: r.capacity,
      gender: r.gender,
      locked_college_id: r.lockedCollegeId || null,
    }));

    const activeBeds = sbBeds.length > 0 ? sbBeds : db.beds.map((b) => ({
      id: b.id,
      room_id: b.roomId,
      label: b.label,
    }));

    const activeAllocations = sbAllocs.length > 0 ? sbAllocs : db.allocations.map((a) => ({
      id: a.id,
      user_id: a.userId,
      bed_id: a.bedId,
      allocated_by: a.allocatedBy,
      created_at: a.createdAt,
    }));

    const activeColleges = sbColleges.length > 0 ? sbColleges : db.colleges.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      color: c.color,
    }));

    const activeUsers = sbUsers.length > 0 ? sbUsers : db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      gender: u.gender,
      role: u.role,
      college_id: u.collegeId,
      college_name: u.collegeName,
    }));

    // 2. Validate & normalize rows
    const cleanedRows: Array<{
      rollNo?: string;
      rawName: string;
      gender: 'MALE' | 'FEMALE';
      age?: string;
      collegeName: string;
      collegeCode?: string;
      city?: string;
      state?: string;
      course?: string;
      year?: string;
      activityCategory?: string;
      specificActivity?: string;
      email: string;
      phone?: string;
    }> = [];

    const defaultColors = ['#2563EB', '#4F46E5', '#7C3AED', '#059669', '#D97706', '#E11D48', '#0891B2', '#0D9488'];
    const newCollegesToInsert: any[] = [];

    for (let i = 0; i < studentsInput.length; i++) {
      const row = studentsInput[i];
      const name = (row.name || '').trim();
      if (!name) continue;

      let genderStr = (row.gender || '').trim().toUpperCase();
      let gender: 'MALE' | 'FEMALE' = 'MALE';
      if (genderStr.startsWith('F') || genderStr.includes('GIRL') || genderStr.includes('WOM')) {
        gender = 'FEMALE';
      }

      const collegeName = (row.collegeName || '').trim();
      if (!collegeName) continue;

      const rollNo = (row.rollNo || '').trim();
      const age = row.age !== undefined && row.age !== null ? String(row.age).trim() : undefined;
      const city = (row.city || '').trim();
      const state = (row.state || '').trim();
      const course = (row.course || '').trim();
      const year = row.year !== undefined && row.year !== null ? String(row.year).trim() : undefined;
      const activityCategory = (row.activityCategory || '').trim();
      const specificActivity = (row.specificActivity || '').trim();

      let email = (row.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        const seed = rollNo ? rollNo.toLowerCase().replace(/[^a-z0-9]/g, '') : name.toLowerCase().replace(/[^a-z0-9]/g, '');
        email = `${seed}_${i}@unifest.local`;
      }

      cleanedRows.push({
        rollNo: rollNo || undefined,
        rawName: name,
        gender,
        age: age || undefined,
        collegeName,
        collegeCode: row.collegeCode?.trim() || undefined,
        city: city || undefined,
        state: state || undefined,
        course: course || undefined,
        year: year || undefined,
        activityCategory: activityCategory || undefined,
        specificActivity: specificActivity || undefined,
        email,
        phone: row.phone?.trim() || undefined,
      });
    }

    if (cleanedRows.length === 0) {
      return NextResponse.json({ error: 'No valid student records found in file. Ensure Name, Gender, and College columns are present.' }, { status: 400 });
    }

    // 3. Resolve or Auto-Create Colleges
    const collegeMap = new Map<string, { id: string; name: string; code: string; color: string }>();

    for (const row of cleanedRows) {
      const searchKey = row.collegeName.toLowerCase();
      if (!collegeMap.has(searchKey)) {
        // Try to match existing registered college
        let matched = activeColleges.find(
          (c) => c.name.toLowerCase() === searchKey || (row.collegeCode && c.code.toLowerCase() === row.collegeCode.toLowerCase())
        );

        if (!matched) {
          // Try to match against NORTH_INDIA_COLLEGES directory
          const dirMatch = NORTH_INDIA_COLLEGES.find(
            (c) => c.name.toLowerCase() === searchKey || (row.collegeCode && c.shortName.toLowerCase() === row.collegeCode.toLowerCase())
          );
          if (dirMatch) {
            matched = {
              id: dirMatch.id,
              name: dirMatch.name,
              code: dirMatch.shortName,
              color: defaultColors[activeColleges.length % defaultColors.length],
            };
          } else {
            // Auto-create college
            const generatedCode = row.collegeCode || (row.collegeName.match(/\b([A-Z0-9]+)\b/g)?.join('') || row.collegeName.slice(0, 4)).toUpperCase();
            matched = {
              id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: row.collegeName,
              code: generatedCode.slice(0, 8),
              color: defaultColors[(activeColleges.length + newCollegesToInsert.length) % defaultColors.length],
            };
          }
          newCollegesToInsert.push(matched);
          activeColleges.push(matched);
        }

        collegeMap.set(searchKey, matched);
      }
    }

    // Save new colleges if any
    // Save new colleges if any
    if (newCollegesToInsert.length > 0) {
      if (supabaseClient) {
        try {
          const { error: cErr } = await supabaseClient.from('colleges').upsert(
            newCollegesToInsert.map((c) => ({
              id: c.id,
              name: c.name,
              code: c.code,
              color: c.color,
            })),
            { onConflict: 'id' }
          );
          if (cErr) {
            console.warn('Supabase college upsert notice:', cErr.message);
          }
        } catch (e) {
          console.warn('Failed to upsert new colleges to Supabase:', e);
        }
      }
      for (const nc of newCollegesToInsert) {
        if (!db.colleges.some((c) => c.id === nc.id)) {
          db.colleges.push({
            id: nc.id,
            name: nc.name,
            code: nc.code,
            color: nc.color,
          });
        }
      }
    }

    // 4. Resolve or Create Users
    const processedStudents: Array<{
      id: string;
      rollNo?: string;
      name: string;
      email: string;
      gender: 'MALE' | 'FEMALE';
      age?: string;
      collegeId: string;
      collegeName: string;
      collegeCode: string;
      city?: string;
      state?: string;
      course?: string;
      year?: string;
      activityCategory?: string;
      specificActivity?: string;
      phone?: string;
    }> = [];

    const newUsersToInsert: any[] = [];
    const alreadyAllocatedUserIds = new Set(activeAllocations.map((a) => a.user_id || a.userId));

    for (const row of cleanedRows) {
      const col = collegeMap.get(row.collegeName.toLowerCase())!;
      let user = activeUsers.find((u) => u.email.toLowerCase() === row.email.toLowerCase());

      if (!user) {
        user = {
          id: `usr-imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: row.rawName,
          email: row.email,
          phone: row.phone || null,
          gender: row.gender,
          role: 'STUDENT',
          college_id: col.id,
          college_name: col.name,
          roll_no: row.rollNo || null,
          course: row.course || null,
          passing_year: row.year ? parseInt(row.year) || null : null,
          address: row.city && row.state ? `${row.city}, ${row.state}` : row.city || row.state || null,
          email_verified: true,
        };
        newUsersToInsert.push({
          ...user,
          rollNo: row.rollNo,
          age: row.age,
          city: row.city,
          state: row.state,
          course: row.course,
          year: row.year,
          activityCategory: row.activityCategory,
          specificActivity: row.specificActivity,
        });
        activeUsers.push(user);
      } else {
        // Ensure student has role STUDENT and proper college
        user.role = 'STUDENT';
        user.gender = row.gender;
        user.college_id = col.id;
        user.college_name = col.name;
        if (row.rollNo) user.roll_no = row.rollNo;
        if (row.course) user.course = row.course;
      }

      processedStudents.push({
        id: user.id,
        rollNo: row.rollNo,
        name: user.name,
        email: user.email,
        gender: user.gender,
        age: row.age,
        collegeId: col.id,
        collegeName: col.name,
        collegeCode: col.code,
        city: row.city,
        state: row.state,
        course: row.course,
        year: row.year,
        activityCategory: row.activityCategory,
        specificActivity: row.specificActivity,
        phone: user.phone || undefined,
      });
    }

    // Insert new users into Supabase & db.json
    if (newUsersToInsert.length > 0) {
      if (supabaseClient) {
        try {
          const { error: uErr } = await supabaseClient.from('users').upsert(
            newUsersToInsert.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              gender: u.gender,
              role: 'STUDENT',
              college_id: u.college_id,
              email_verified: true,
              password: 'unifest123',
            })),
            { onConflict: 'id' }
          );
          if (uErr) {
            console.warn('Supabase user upsert notice, trying fallback without college_id foreign key:', uErr.message);
            const { error: uErr2 } = await supabaseClient.from('users').upsert(
              newUsersToInsert.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                gender: u.gender,
                role: 'STUDENT',
                college_id: null,
                email_verified: true,
                password: 'unifest123',
              })),
              { onConflict: 'id' }
            );
            if (uErr2) {
              console.warn('Supabase fallback user upsert failed:', uErr2.message);
            }
          }
        } catch (e) {
          console.warn('Failed to upsert new users to Supabase:', e);
        }
      }
      for (const nu of newUsersToInsert) {
        if (!db.users.some((u) => u.id === nu.id)) {
          db.users.push({
            id: nu.id,
            name: nu.name,
            email: nu.email,
            phone: nu.phone,
            gender: nu.gender,
            role: 'STUDENT',
            collegeId: nu.college_id,
            collegeName: nu.college_name,
            rollNo: nu.rollNo || null,
            age: nu.age || null,
            city: nu.city || null,
            state: nu.state || null,
            course: nu.course || null,
            passingYear: nu.year ? parseInt(nu.year) || null : null,
            activityCategory: nu.activityCategory || null,
            specificActivity: nu.specificActivity || null,
            emailVerified: true,
          } as User);
        }
      }
    }

    // 5. Build Working State of Rooms & Beds
    const occupiedBedIds = new Set(activeAllocations.map((a) => a.bed_id || a.bedId));

    // Map each room to its live mutable status
    interface WorkingRoom {
      id: string;
      hostelId: string;
      hostelName: string;
      hostelCollegeId: string | null;
      number: string;
      floor: number;
      capacity: number;
      gender: 'MALE' | 'FEMALE';
      lockedCollegeId: string | null;
      freeBeds: Array<{ id: string; label: string }>;
      occupiedCount: number;
    }

    const workingRooms = new Map<string, WorkingRoom>();

    for (const r of activeRooms) {
      const hostel = activeHostels.find((h) => h.id === r.hostel_id);
      const roomBeds = activeBeds.filter((b) => b.room_id === r.id);
      const freeBedsList = roomBeds
        .filter((b) => !occupiedBedIds.has(b.id))
        .map((b) => ({ id: b.id, label: b.label }));

      const occupiedCount = roomBeds.length - freeBedsList.length;
      const lockedColId = occupiedCount > 0 ? (r.locked_college_id || null) : null;

      workingRooms.set(r.id, {
        id: r.id,
        hostelId: r.hostel_id,
        hostelName: hostel?.name || 'Hostel',
        hostelCollegeId: hostel?.college_id || null,
        number: r.number,
        floor: r.floor,
        capacity: r.capacity,
        gender: r.gender,
        lockedCollegeId: lockedColId,
        freeBeds: freeBedsList,
        occupiedCount,
      });
    }

    // 6. Partition Students into Groups: G[(collegeId, gender)]
    // Exclude students who are ALREADY allocated a room!
    const unallocatedQueue: typeof processedStudents = [];
    const alreadyAllocatedSkipped: Array<{ name: string; email: string; collegeName: string }> = [];

    for (const s of processedStudents) {
      if (alreadyAllocatedUserIds.has(s.id)) {
        alreadyAllocatedSkipped.push({ name: s.name, email: s.email, collegeName: s.collegeName });
      } else {
        unallocatedQueue.push(s);
      }
    }

    const groupsMap = new Map<string, { collegeId: string; collegeName: string; collegeCode: string; gender: Gender; students: typeof processedStudents }>();

    for (const student of unallocatedQueue) {
      const key = `${student.collegeId}__${student.gender}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          collegeId: student.collegeId,
          collegeName: student.collegeName,
          collegeCode: student.collegeCode,
          gender: student.gender,
          students: [],
        });
      }
      groupsMap.get(key)!.students.push(student);
    }

    // Sort groups largest to smallest for optimal bin packing
    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => b.students.length - a.students.length);

    // 7. Execute Allocation Engine with Strict Invariants:
    // INVARIANT 1: Strict Gender Segregation (male in male hostel/room only, female in female hostel/room only)
    // INVARIANT 2: Strict Same-College Room Lock (never mix students of different colleges in same room)
    const newAllocationsToPersist: Array<{
      id: string;
      userId: string;
      bedId: string;
      allocatedBy: string;
      userName: string;
      userEmail: string;
      collegeName: string;
      collegeCode: string;
      gender: Gender;
      hostelName: string;
      roomNumber: string;
      bedLabel: string;
    }> = [];

    const roomLocksToUpdate = new Map<string, string>(); // roomId -> lockedCollegeId
    const shortfalls: Array<{ collegeName: string; collegeCode: string; gender: Gender; unallocatedCount: number; reason: string }> = [];

    for (const group of sortedGroups) {
      const remainingStudents = [...group.students];

      // Step A: Find candidate rooms
      // MUST match gender: room.gender === group.gender
      // MUST have free beds: room.freeBeds.length > 0
      // MUST satisfy same-college condition:
      // either already locked to group.collegeId (with occupants of this college),
      // OR completely vacant (occupiedCount === 0 and not locked to another college)
      const allCandidateRooms = Array.from(workingRooms.values()).filter((wr) => {
        if (wr.gender !== group.gender) return false;
        if (wr.freeBeds.length === 0) return false;

        // If room is locked to another college, FORBIDDEN
        if (wr.lockedCollegeId !== null && wr.lockedCollegeId !== group.collegeId) {
          return false;
        }

        // If room is locked to this college, ALLOWED
        if (wr.lockedCollegeId === group.collegeId) {
          return true;
        }

        // If room is empty, ALLOWED
        if (wr.occupiedCount === 0) {
          return true;
        }

        return false;
      });

      // Priority 1: Rooms in designated college hostel already locked to this college
      // Priority 2: Rooms in any hostel already locked to this college (top up partial rooms)
      // Priority 3: Empty rooms in designated college hostel
      // Priority 4: Empty rooms in shared campus hostels
      const sortedCandidates = allCandidateRooms.sort((a, b) => {
        const aIsDesignated = a.hostelCollegeId === group.collegeId;
        const bIsDesignated = b.hostelCollegeId === group.collegeId;

        const aIsPartial = a.lockedCollegeId === group.collegeId && a.occupiedCount > 0;
        const bIsPartial = b.lockedCollegeId === group.collegeId && b.occupiedCount > 0;

        // Partial rooms first (so we don't fragment rooms)
        if (aIsPartial && !bIsPartial) return -1;
        if (!aIsPartial && bIsPartial) return 1;

        // Then designated college hostel preference
        if (aIsDesignated && !bIsDesignated) return -1;
        if (!aIsDesignated && bIsDesignated) return 1;

        // Best fit for empty rooms: smallest that fits or largest available
        return b.freeBeds.length - a.freeBeds.length;
      });

      // Allocate students into candidate rooms
      for (const room of sortedCandidates) {
        if (remainingStudents.length === 0) break;

        // LOCK room to this college
        room.lockedCollegeId = group.collegeId;
        roomLocksToUpdate.set(room.id, group.collegeId);

        while (room.freeBeds.length > 0 && remainingStudents.length > 0) {
          const bed = room.freeBeds.shift()!;
          const student = remainingStudents.shift()!;
          room.occupiedCount++;

          const allocRecord = {
            id: `alloc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId: student.id,
            bedId: bed.id,
            allocatedBy: activeUser.name,
            rollNo: student.rollNo,
            userName: student.name,
            userEmail: student.email,
            userPhone: student.phone,
            collegeName: group.collegeName,
            collegeCode: group.collegeCode,
            gender: group.gender,
            age: student.age,
            city: student.city,
            state: student.state,
            course: student.course,
            year: student.year,
            activityCategory: student.activityCategory,
            specificActivity: student.specificActivity,
            hostelName: room.hostelName,
            roomNumber: room.number,
            bedLabel: bed.label,
          };

          newAllocationsToPersist.push(allocRecord);
          alreadyAllocatedUserIds.add(student.id);
        }
      }

      if (remainingStudents.length > 0) {
        shortfalls.push({
          collegeName: group.collegeName,
          collegeCode: group.collegeCode,
          gender: group.gender,
          unallocatedCount: remainingStudents.length,
          reason: `Insufficient vacant rooms for ${group.gender === 'MALE' ? 'Boys' : 'Girls'} from ${group.collegeName}. Rooms from other colleges cannot be mixed.`,
        });
      }
    }

    // 8. Commit Allotments to Database (Supabase + local db.json)
    if (newAllocationsToPersist.length > 0) {
      // Supabase persist
      if (supabaseClient) {
        try {
          // Insert allocations
          const { error: aErr } = await supabaseClient.from('allocations').insert(
            newAllocationsToPersist.map((a) => ({
              id: a.id,
              user_id: a.userId,
              bed_id: a.bedId,
              allocated_by: a.allocatedBy,
              is_override: false,
              reason: 'Bulk CSV Allotment - Same College Rule Enforced',
            }))
          );
          if (aErr) {
            console.warn('Supabase allocations insert notice:', aErr.message);
          }

          // Update locked_college_id on rooms
          for (const [roomId, collegeId] of Array.from(roomLocksToUpdate.entries())) {
            const { error: rErr } = await supabaseClient.from('rooms').update({ locked_college_id: collegeId }).eq('id', roomId);
            if (rErr) {
              console.warn(`Supabase room lock update notice for room ${roomId}:`, rErr.message);
            }
          }
        } catch (e) {
          console.warn('Failed to commit allocations to Supabase:', e);
        }
      }

      // Local db.json persist
      for (const a of newAllocationsToPersist) {
        db.allocations.push({
          id: a.id,
          userId: a.userId,
          bedId: a.bedId,
          allocatedBy: a.allocatedBy,
          isOverride: false,
          reason: 'Bulk CSV Allotment',
          createdAt: new Date().toISOString(),
        } as RoomAllocation);
      }

      for (const [roomId, collegeId] of Array.from(roomLocksToUpdate.entries())) {
        const localRoom = db.rooms.find((r) => r.id === roomId);
        if (localRoom) {
          localRoom.lockedCollegeId = collegeId;
        }
      }

      // Audit Log
      db.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        actorId: activeUser.id,
        actorName: activeUser.name,
        action: 'BULK_ALLOT_STUDENTS',
        entity: 'RoomAllocation',
        entityId: `batch-${Date.now()}`,
        reason: `Bulk allotted ${newAllocationsToPersist.length} students across rooms ensuring same-college room constraint.`,
        before: null,
        after: {
          allottedCount: newAllocationsToPersist.length,
          roomsLockedCount: roomLocksToUpdate.size,
          shortfallsCount: shortfalls.length,
        },
        at: new Date().toISOString(),
      } as AuditLog);

      writeDatabase(db);
    }

    return NextResponse.json({
      success: true,
      totalRowsProcessed: cleanedRows.length,
      allottedCount: newAllocationsToPersist.length,
      alreadyAllocatedCount: alreadyAllocatedSkipped.length,
      unallocatedCount: shortfalls.reduce((acc, s) => acc + s.unallocatedCount, 0),
      roomsLockedCount: roomLocksToUpdate.size,
      shortfalls,
      alreadyAllocatedSkipped,
      allocations: newAllocationsToPersist,
    });
  } catch (err: unknown) {
    console.error('Bulk allot error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Bulk room allotment failed' }, { status: 500 });
  }
}
