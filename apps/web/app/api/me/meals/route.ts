import { NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase } from '@/lib/db';

export async function GET() {
  const activeUser = getActiveUser();
  const db = readDatabase();
  const now = new Date();

  const userMealLogs = db.mealLogs.filter((m) => m.userId === activeUser.id);
  const redeemedSlotIds = new Set(userMealLogs.map((m) => m.slotId));

  const slotsWithStatus = db.mealSlots.map((slot) => {
    // Find batch assigned to this student's (collegeId, gender)
    const assignedBatch = db.mealBatches.find(
      (b) =>
        b.slotId === slot.id &&
        b.collegeId === activeUser.collegeId &&
        b.gender === activeUser.gender
    );

    const isRedeemed = redeemedSlotIds.has(slot.id);
    const redemptionLog = userMealLogs.find((m) => m.slotId === slot.id);

    let batchStatus: 'UPCOMING' | 'OPEN_NOW' | 'REDEEMED' | 'MISSED' | 'NO_BATCH' = 'NO_BATCH';

    if (isRedeemed) {
      batchStatus = 'REDEEMED';
    } else if (assignedBatch) {
      const start = new Date(assignedBatch.startsAt).getTime();
      const end = new Date(assignedBatch.endsAt).getTime();
      const nowTime = now.getTime();
      const gracePeriodMs = 15 * 60 * 1000;

      if (nowTime < start - gracePeriodMs) {
        batchStatus = 'UPCOMING';
      } else if (nowTime <= end + gracePeriodMs) {
        batchStatus = 'OPEN_NOW';
      } else {
        batchStatus = 'MISSED';
      }
    }

    return {
      slotId: slot.id,
      date: slot.date,
      type: slot.type,
      batch: assignedBatch
        ? {
            id: assignedBatch.id,
            startsAt: assignedBatch.startsAt,
            endsAt: assignedBatch.endsAt,
          }
        : null,
      status: batchStatus,
      redemptionTime: redemptionLog ? redemptionLog.at : null,
      isException: redemptionLog?.isException || false,
    };
  });

  return NextResponse.json(slotsWithStatus);
}
