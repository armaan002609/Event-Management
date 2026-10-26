import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { overrideStudentAllocation } from '@/lib/allocation-engine';

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, targetBedId, reason, forceException } = await req.json();

    if (!userId || !targetBedId || !reason) {
      return NextResponse.json(
        { error: 'userId, targetBedId, and mandatory reason are required.' },
        { status: 400 }
      );
    }

    const result = overrideStudentAllocation({
      userId,
      targetBedId,
      actorId: activeUser.id,
      reason,
      forceException: !!forceException,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
