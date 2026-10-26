import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser, getOptionalActiveUserAsync, isAdminUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { User, Role, AuditLog } from '@unifest/shared';

export async function GET(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get('role');
  const collegeFilter = searchParams.get('collegeId');
  const search = searchParams.get('search')?.toLowerCase();

  let users: any[] = [];

  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      const { data: sbUsers, error } = await sb
        .from('users')
        .select('*, college:colleges(*)');
      if (!error && Array.isArray(sbUsers) && sbUsers.length > 0) {
        users = sbUsers.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          fatherName: u.father_name,
          fatherPhone: u.father_phone,
          address: u.address,
          collegeId: u.college_id,
          collegeName: u.college_name || u.college?.name || null,
          college: u.college,
          rollNo: u.roll_no,
          course: u.course,
          passingYear: u.passing_year,
          avatarUrl: u.avatar_url,
          isProfileComplete: u.is_profile_complete,
          gender: u.gender,
          role: u.role,
          emailVerified: u.email_verified,
        }));
      }
    }
  } catch {}

  // Fallback to local db if Supabase not reachable
  if (users.length === 0) {
    const db = readDatabase();
    users = db.users.map((u) => {
      const col = db.colleges.find((c) => c.id === u.collegeId);
      return {
        ...u,
        college: col,
      };
    });
  }

  if (roleFilter) {
    users = users.filter((u) => u.role === roleFilter);
  }
  if (collegeFilter) {
    users = users.filter((u) => u.collegeId === collegeFilter);
  }
  if (search) {
    users = users.filter(
      (u) =>
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        (u.college?.name && u.college.name.toLowerCase().includes(search)) ||
        (u.college?.code && u.college.code.toLowerCase().includes(search))
    );
  }

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { name, email, phone, gender, role, collegeId } = await req.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'name, email, and role are required' }, { status: 400 });
    }

    const db = readDatabase();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      phone: phone || null,
      gender: gender || 'MALE',
      role: role as Role,
      collegeId: role === 'STUDENT' ? collegeId : null,
      emailVerified: true,
    };

    db.users.push(newUser);

    // If student, issue QR ticket
    if (newUser.role === 'STUDENT') {
      db.qrTickets.push({
        id: `ticket-${newUser.id}`,
        userId: newUser.id,
        tokenId: `jti-${newUser.id}-${Date.now()}`,
        version: 1,
        issuedAt: new Date().toISOString(),
      });
    }

    // Audit log
    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      actorId: activeUser.id,
      actorName: activeUser.name,
      action: 'USER_CREATE',
      entity: 'User',
      entityId: newUser.id,
      reason: `Admin created user with role ${role}`,
      before: null,
      after: newUser as unknown as Record<string, unknown>,
      at: new Date().toISOString(),
    };
    db.auditLogs.unshift(auditEntry);

    writeDatabase(db);

    return NextResponse.json(newUser);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { userId, role, emailVerified, collegeId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const db = readDatabase();
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const before = { ...db.users[userIndex] };

    if (role) db.users[userIndex].role = role as Role;
    if (typeof emailVerified === 'boolean') db.users[userIndex].emailVerified = emailVerified;
    if (collegeId !== undefined) db.users[userIndex].collegeId = collegeId;

    // Directly persist to Supabase PostgreSQL database
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      if (sb) {
        await sb
          .from('users')
          .update({
            ...(role ? { role } : {}),
            ...(typeof emailVerified === 'boolean' ? { email_verified: emailVerified } : {}),
            ...(collegeId !== undefined ? { college_id: collegeId } : {}),
          })
          .eq('id', userId);
      }
    } catch (e) {
      console.warn('Failed to sync role update to Supabase:', e);
    }

    // Audit log
    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      actorId: activeUser.id,
      actorName: activeUser.name,
      action: 'USER_ROLE_UPDATE',
      entity: 'User',
      entityId: userId,
      reason: `Admin updated user properties: role=${role}, emailVerified=${emailVerified}`,
      before: before as unknown as Record<string, unknown>,
      after: db.users[userIndex] as unknown as Record<string, unknown>,
      at: new Date().toISOString(),
    };
    db.auditLogs.unshift(auditEntry);

    writeDatabase(db);

    return NextResponse.json(db.users[userIndex]);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
