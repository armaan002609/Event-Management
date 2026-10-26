import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser, getOptionalActiveUserAsync, isAdminUser } from '@/lib/auth';
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
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const db = readDatabase();
  let stats = {
    usersCount: db.users.length,
    collegesCount: db.colleges.length,
    hostelsCount: db.hostels.length,
    roomsCount: db.rooms.length,
    bedsCount: db.beds.length,
    allocationsCount: db.allocations.length,
    eventsCount: db.events.length,
    scansCount: db.scanLogs.length,
    auditLogsCount: db.auditLogs.length,
  };

  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    if (sb) {
      const [
        { count: uCount },
        { count: cCount },
        { count: hCount },
        { count: rCount },
        { count: bCount },
        { count: aCount },
        { count: eCount },
      ] = await Promise.all([
        sb.from('users').select('*', { count: 'exact', head: true }),
        sb.from('colleges').select('*', { count: 'exact', head: true }),
        sb.from('hostels').select('*', { count: 'exact', head: true }),
        sb.from('rooms').select('*', { count: 'exact', head: true }),
        sb.from('beds').select('*', { count: 'exact', head: true }),
        sb.from('allocations').select('*', { count: 'exact', head: true }),
        sb.from('events').select('*', { count: 'exact', head: true }),
      ]);

      stats = {
        usersCount: uCount ?? db.users.length,
        collegesCount: cCount ?? db.colleges.length,
        hostelsCount: hCount ?? db.hostels.length,
        roomsCount: rCount ?? db.rooms.length,
        bedsCount: bCount ?? db.beds.length,
        allocationsCount: aCount ?? db.allocations.length,
        eventsCount: eCount ?? db.events.length,
        scansCount: db.scanLogs.length,
        auditLogsCount: db.auditLogs.length,
      };
    }
  } catch {}

  return NextResponse.json({
    config: systemConfig,
    stats,
  });
}

export async function POST(req: NextRequest) {
  const activeUser = (await getOptionalActiveUserAsync()) || getActiveUser();
  if (!isAdminUser(activeUser)) {
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
