import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { MealSlot } from '@unifest/shared';

export async function GET() {
  const db = readDatabase();
  const slotsWithBatches = db.mealSlots.map((slot) => {
    const batches = db.mealBatches
      .filter((b) => b.slotId === slot.id)
      .map((b) => {
        const col = db.colleges.find((c) => c.id === b.collegeId);
        return {
          ...b,
          college: col,
        };
      });

    return {
      ...slot,
      batches,
    };
  });

  return NextResponse.json(slotsWithBatches);
}

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { date, type } = await req.json();
    if (!date || !type) {
      return NextResponse.json({ error: 'date and type are required' }, { status: 400 });
    }

    const db = readDatabase();
    const existing = db.mealSlots.find((s) => s.date === date && s.type === type);
    if (existing) {
      return NextResponse.json({ error: 'Slot already exists for this date and type.' }, { status: 400 });
    }

    const newSlot: MealSlot = {
      id: `slot-${type.toLowerCase()}-${Date.now()}`,
      date,
      type,
    };

    db.mealSlots.push(newSlot);
    writeDatabase(db);

    return NextResponse.json(newSlot);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
