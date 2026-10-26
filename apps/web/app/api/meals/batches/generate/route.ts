import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { MealBatch } from '@unifest/shared';

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { slotId, startTime, batchDurationMinutes = 20 } = await req.json();

    if (!slotId || !startTime) {
      return NextResponse.json({ error: 'slotId and startTime (ISO) are required.' }, { status: 400 });
    }

    const db = readDatabase();
    const slot = db.mealSlots.find((s) => s.id === slotId);
    if (!slot) {
      return NextResponse.json({ error: 'Meal slot not found' }, { status: 404 });
    }

    // Remove old batches for this slot
    db.mealBatches = db.mealBatches.filter((b) => b.slotId !== slotId);

    // Stagger batches by (college x gender)
    const newBatches: MealBatch[] = [];
    let currentStart = new Date(startTime).getTime();
    const durationMs = batchDurationMinutes * 60 * 1000;

    for (const college of db.colleges) {
      // Create Male batch
      const maleEnd = currentStart + durationMs;
      newBatches.push({
        id: `batch-${slotId}-${college.code.toLowerCase()}-m`,
        slotId,
        collegeId: college.id,
        gender: 'MALE',
        startsAt: new Date(currentStart).toISOString(),
        endsAt: new Date(maleEnd).toISOString(),
      });

      // Create Female batch
      newBatches.push({
        id: `batch-${slotId}-${college.code.toLowerCase()}-f`,
        slotId,
        collegeId: college.id,
        gender: 'FEMALE',
        startsAt: new Date(currentStart).toISOString(),
        endsAt: new Date(maleEnd).toISOString(),
      });

      // Stagger next college
      currentStart += durationMs;
    }

    db.mealBatches.push(...newBatches);

    // Audit log
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId: activeUser.id,
      actorName: activeUser.name,
      action: 'MEAL_BATCHES_GENERATE',
      entity: 'MealSlot',
      entityId: slotId,
      reason: `Generated ${newBatches.length} batches staggered by ${batchDurationMinutes} mins.`,
      before: null,
      after: { batchesCount: newBatches.length },
      at: new Date().toISOString(),
    });

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      batches: newBatches,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
