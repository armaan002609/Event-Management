import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';

export async function GET() {
  const db = readDatabase();
  const totalStudents = db.users.filter((u) => u.role === 'STUDENT').length;

  const slotStats = db.mealSlots.map((slot) => {
    const slotLogs = db.mealLogs.filter((m) => m.slotId === slot.id);
    const totalServed = slotLogs.length;
    const exceptionsCount = slotLogs.filter((m) => m.isException).length;

    // Batches breakdown
    const batches = db.mealBatches.filter((b) => b.slotId === slot.id);
    const batchBreakdown = batches.map((batch) => {
      const col = db.colleges.find((c) => c.id === batch.collegeId);
      const batchLogs = slotLogs.filter((m) => m.batchId === batch.id);

      // Total students eligible in this batch
      const eligibleCount = db.users.filter(
        (u) => u.role === 'STUDENT' && u.collegeId === batch.collegeId && u.gender === batch.gender
      ).length;

      return {
        batchId: batch.id,
        collegeCode: col?.code || 'N/A',
        collegeName: col?.name || 'Unknown',
        collegeColor: col?.color || '#3B3FD9',
        gender: batch.gender,
        startsAt: batch.startsAt,
        endsAt: batch.endsAt,
        servedCount: batchLogs.length,
        eligibleCount,
        percent: eligibleCount > 0 ? Math.round((batchLogs.length / eligibleCount) * 100) : 0,
      };
    });

    return {
      slotId: slot.id,
      date: slot.date,
      type: slot.type,
      totalServed,
      exceptionsCount,
      totalEligible: totalStudents,
      percent: totalStudents > 0 ? Math.round((totalServed / totalStudents) * 100) : 0,
      batches: batchBreakdown,
    };
  });

  return NextResponse.json({
    slots: slotStats,
    recentRedemptions: db.mealLogs.slice(0, 20).map((log) => {
      const user = db.users.find((u) => u.id === log.userId);
      const col = db.colleges.find((c) => c.id === user?.collegeId);
      const slot = db.mealSlots.find((s) => s.id === log.slotId);
      return {
        id: log.id,
        userName: user?.name,
        collegeCode: col?.code,
        slotType: slot?.type,
        isException: log.isException,
        at: log.at,
      };
    }),
  });
}
