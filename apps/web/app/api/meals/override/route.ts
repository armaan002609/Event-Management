import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { MealLog, AuditLog } from '@unifest/shared';

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, slotId, reason } = await req.json();
    if (!userId || !slotId || !reason) {
      return NextResponse.json({ error: 'userId, slotId, and reason are required' }, { status: 400 });
    }

    const db = readDatabase();
    const user = db.users.find((u) => u.id === userId);
    const slot = db.mealSlots.find((s) => s.id === slotId);

    if (!user || !slot) {
      return NextResponse.json({ error: 'User or Slot not found' }, { status: 404 });
    }

    // Check if already redeemed
    const already = db.mealLogs.find((m) => m.userId === userId && m.slotId === slotId);
    if (already) {
      return NextResponse.json({ error: 'Meal already logged for this slot.' }, { status: 400 });
    }

    const newMealLog: MealLog = {
      id: `mlog-override-${Date.now()}`,
      userId,
      slotId,
      batchId: 'exception-override',
      scannedBy: activeUser.id,
      isException: true,
      at: new Date().toISOString(),
    };

    db.mealLogs.unshift(newMealLog);

    // Audit Log entry (mandatory per BR-10)
    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      actorId: activeUser.id,
      actorName: activeUser.name,
      action: 'MEAL_EXCEPTION_GRANT',
      entity: 'MealLog',
      entityId: newMealLog.id,
      reason,
      before: null,
      after: {
        userId,
        studentName: user.name,
        slotId,
        slotType: slot.type,
        grantedBy: activeUser.name,
      },
      at: new Date().toISOString(),
    };
    db.auditLogs.unshift(auditEntry);

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: `Meal exception granted for ${user.name} (${slot.type}).`,
      mealLog: newMealLog,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
