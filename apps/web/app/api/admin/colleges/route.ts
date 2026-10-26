import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser, getOptionalActiveUserAsync, isAdminUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { College, AuditLog } from '@unifest/shared';

export async function GET() {
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      const [{ data: sbColleges }, { data: sbUsers }, { data: sbRooms }] = await Promise.all([
        sb.from('colleges').select('*'),
        sb.from('users').select('*'),
        sb.from('rooms').select('*'),
      ]);

      if (sbColleges) {
        const usersList = sbUsers || [];
        const roomsList = sbRooms || [];
        const collegesWithStats = sbColleges.map((col: any) => {
          const students = usersList.filter((u: any) => u.college_id === col.id && u.role === 'STUDENT');
          const maleStudents = students.filter((u: any) => u.gender === 'MALE').length;
          const femaleStudents = students.filter((u: any) => u.gender === 'FEMALE').length;
          const lockedRooms = roomsList.filter((r: any) => r.locked_college_id === col.id).length;

          return {
            id: col.id,
            name: col.name,
            code: col.code,
            color: col.color,
            totalStudents: students.length,
            maleStudents,
            femaleStudents,
            lockedRooms,
          };
        });

        return NextResponse.json(collegesWithStats);
      }
    }
  } catch {}

  const db = readDatabase();
  const collegesWithStats = db.colleges.map((col) => {
    const students = db.users.filter((u) => u.collegeId === col.id && u.role === 'STUDENT');
    const maleStudents = students.filter((u) => u.gender === 'MALE').length;
    const femaleStudents = students.filter((u) => u.gender === 'FEMALE').length;
    const lockedRooms = db.rooms.filter((r) => r.lockedCollegeId === col.id).length;

    return {
      ...col,
      totalStudents: students.length,
      maleStudents,
      femaleStudents,
      lockedRooms,
    };
  });

  return NextResponse.json(collegesWithStats);
}

export async function POST(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { name, code, color } = await req.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'College name and code are required.' }, { status: 400 });
    }

    const db = readDatabase();
    const existing = db.colleges.find(
      (c) => c.code.toLowerCase() === code.toLowerCase() || c.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return NextResponse.json({ error: 'College with this name or code already exists.' }, { status: 400 });
    }

    const newCollege: College = {
      id: `col-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name,
      code: code.toUpperCase(),
      color: color || '#4F46E5',
    };

    // Save to Supabase
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      if (sb) {
        await sb.from('colleges').upsert({
          id: newCollege.id,
          name: newCollege.name,
          code: newCollege.code,
          color: newCollege.color,
        });
      }
    } catch (e) {
      console.warn('Supabase college insert error:', e);
    }

    db.colleges.push(newCollege);

    // Audit Log
    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      actorId: activeUser.id,
      actorName: activeUser.name,
      action: 'COLLEGE_CREATE',
      entity: 'College',
      entityId: newCollege.id,
      reason: `Admin registered new participating institution: ${name} (${code})`,
      before: null,
      after: newCollege as unknown as Record<string, unknown>,
      at: new Date().toISOString(),
    };
    db.auditLogs.unshift(auditEntry);

    writeDatabase(db);

    return NextResponse.json(newCollege);
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
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'College ID is required.' }, { status: 400 });
    }

    // Delete in Supabase
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      if (sb) {
        await sb.from('rooms').update({ locked_college_id: null }).eq('locked_college_id', id);
        await sb.from('meal_batches').delete().eq('college_id', id);
        await sb.from('colleges').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase college delete error:', e);
    }

    const db = readDatabase();
    db.colleges = db.colleges.filter((c) => c.id !== id);
    db.rooms.forEach((r) => {
      if (r.lockedCollegeId === id) r.lockedCollegeId = null;
    });
    db.mealBatches = db.mealBatches.filter((b) => b.collegeId !== id);
    writeDatabase(db);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
