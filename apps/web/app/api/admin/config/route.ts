import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { FESTIVAL_ID } from '@unifest/shared';

// In-memory/persisted configuration
let systemConfig = {
  festivalName: 'UniFest 2026: Inter-College Sports & Folk Festival',
  festivalId: FESTIVAL_ID,
  mealGracePeriodMinutes: 15,
  registrationCutoffHours: 2,
  allowStudentWaitlist: true,
  strictGenderSeparation: true,
  auditLogRetentionDays: 365,
};

export async function GET() {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const db = readDatabase();
  return NextResponse.json({
    config: systemConfig,
    stats: {
      usersCount: db.users.length,
      collegesCount: db.colleges.length,
      hostelsCount: db.hostels.length,
      roomsCount: db.rooms.length,
      bedsCount: db.beds.length,
      allocationsCount: db.allocations.length,
      eventsCount: db.events.length,
      scansCount: db.scanLogs.length,
      auditLogsCount: db.auditLogs.length,
    },
  });
}

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const updates = await req.json();
    systemConfig = {
      ...systemConfig,
      ...updates,
    };

    const db = readDatabase();
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId: activeUser.id,
      actorName: activeUser.name,
      action: 'SYSTEM_CONFIG_UPDATE',
      entity: 'SystemConfig',
      entityId: FESTIVAL_ID,
      reason: 'Admin updated festival global operational parameters',
      before: null,
      after: systemConfig,
      at: new Date().toISOString(),
    });
    writeDatabase(db);

    return NextResponse.json(systemConfig);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
