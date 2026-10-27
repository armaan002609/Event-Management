import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser, getOptionalActiveUserAsync, isAdminUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { User, Role, AuditLog } from '@unifest/shared';

export async function GET(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync(req)) || getActiveUser(req);
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

  // Merge with local db to ensure any locally cached users are included
  const db = readDatabase();
  const knownIds = new Set(users.map((u) => u.id));
  for (const u of db.users) {
    if (!knownIds.has(u.id)) {
      const col = db.colleges.find((c) => c.id === u.collegeId);
      users.push({
        ...u,
        college: col,
      });
      knownIds.add(u.id);
    }
  }

  if (roleFilter && roleFilter !== 'ALL') {
    users = users.filter((u) => u.role === roleFilter);
  }
  if (collegeFilter && collegeFilter !== 'ALL') {
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
  const activeUser = (await getOptionalActiveUserAsync(req)) || getActiveUser(req);
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { name, email, phone, gender, role, collegeId } = await req.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'name, email, and role are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = readDatabase();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
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

    // Sync to Supabase
    try {
      const { supabaseUpsertUser } = await import('@/lib/supabase');
      await supabaseUpsertUser(newUser);
    } catch (e) {
      console.warn('Failed to insert user to Supabase:', e);
    }

    return NextResponse.json(newUser);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync(req)) || getActiveUser(req);
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const { userId, role, emailVerified, collegeId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const db = readDatabase();
    let userIndex = db.users.findIndex((u) => u.id === userId);

    // If user is in Supabase but not yet in local db.users, fetch from Supabase
    if (userIndex === -1) {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const sb = getSupabase();
        if (sb) {
          const { data: sbUser } = await sb.from('users').select('*').eq('id', userId).single();
          if (sbUser) {
            const mappedUser: User = {
              id: sbUser.id,
              name: sbUser.name,
              email: sbUser.email,
              phone: sbUser.phone,
              fatherName: sbUser.father_name,
              fatherPhone: sbUser.father_phone,
              address: sbUser.address,
              collegeId: sbUser.college_id,
              collegeName: sbUser.college_name,
              rollNo: sbUser.roll_no,
              course: sbUser.course,
              passingYear: sbUser.passing_year,
              avatarUrl: sbUser.avatar_url,
              isProfileComplete: sbUser.is_profile_complete,
              gender: sbUser.gender,
              role: sbUser.role,
              emailVerified: sbUser.email_verified,
            };
            db.users.push(mappedUser);
            userIndex = db.users.length - 1;
          }
        }
      } catch (err) {
        console.warn('Supabase user lookup error:', err);
      }
    }

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found in database.' }, { status: 404 });
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

    const updatedUser = db.users[userIndex];
    const college = db.colleges.find((c) => c.id === updatedUser.collegeId);
    return NextResponse.json({ ...updatedUser, college });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync(req)) || getActiveUser(req);
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  let userId = searchParams.get('userId');
  if (!userId) {
    try {
      const body = await req.json();
      userId = body?.userId;
    } catch {}
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId is required for deletion.' }, { status: 400 });
  }

  if (activeUser.id === userId) {
    return NextResponse.json({ error: 'Cannot delete your own active administrator account.' }, { status: 400 });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => u.id === userId);
  let userName = userIndex !== -1 ? db.users[userIndex].name : userId;
  let userEmail = userIndex !== -1 ? db.users[userIndex].email : '';
  let deletedUser = userIndex !== -1 ? { ...db.users[userIndex] } : null;

  // 1. Delete from Supabase
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      if (!deletedUser) {
        const { data: sbU } = await sb.from('users').select('*').eq('id', userId).single();
        if (sbU) {
          userName = sbU.name;
          userEmail = sbU.email;
          deletedUser = sbU;
        }
      }
      await sb.from('allocations').delete().eq('user_id', userId);
      await sb.from('registrations').delete().eq('user_id', userId);
      await sb.from('qr_tickets').delete().eq('user_id', userId);
      await sb.from('checkin_logs').delete().eq('user_id', userId);
      await sb.from('users').delete().eq('id', userId);
    }
  } catch (err) {
    console.warn('Supabase user deletion error:', err);
  }

  // 2. Free any bed occupied by this user in local database
  const userAlloc = db.allocations.find((a) => a.userId === userId);
  if (userAlloc) {
    const bed = db.beds.find((b) => b.id === userAlloc.bedId);
    if (bed) bed.allocation = null;
  }

  // 3. Delete from local database
  if (userIndex !== -1) {
    db.users.splice(userIndex, 1);
  }
  db.allocations = db.allocations.filter((a) => a.userId !== userId);
  db.registrations = db.registrations.filter((r) => r.userId !== userId);
  db.qrTickets = db.qrTickets.filter((t) => t.userId !== userId);
  db.checkinLogs = db.checkinLogs.filter((l) => l.userId !== userId);

  // 4. Record audit log
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    actorId: activeUser.id,
    actorName: activeUser.name,
    action: 'USER_DELETE',
    entity: 'User',
    entityId: userId,
    reason: `Admin ${activeUser.name} permanently deleted user account: ${userName} (${userEmail})`,
    before: deletedUser as unknown as Record<string, unknown>,
    after: null,
    at: new Date().toISOString(),
  });

  writeDatabase(db);

  return NextResponse.json({
    success: true,
    message: `User "${userName}" has been permanently deleted.`,
    deletedUserId: userId,
  });
}
