import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { User, Role, AuditLog } from '@unifest/shared';

export async function GET(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const db = readDatabase();
  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get('role');
  const collegeFilter = searchParams.get('collegeId');
  const search = searchParams.get('search')?.toLowerCase();

  let users = db.users.map((u) => {
    const col = db.colleges.find((c) => c.id === u.collegeId);
    return {
      ...u,
      college: col,
    };
  });

  if (roleFilter) {
    users = users.filter((u) => u.role === roleFilter);
  }
  if (collegeFilter) {
    users = users.filter((u) => u.collegeId === collegeFilter);
  }
  if (search) {
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.college?.name && u.college.name.toLowerCase().includes(search)) ||
        (u.college?.code && u.college.code.toLowerCase().includes(search))
    );
  }

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'ADMIN') {
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
  const activeUser = getActiveUser();
  if (activeUser.role !== 'ADMIN') {
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
