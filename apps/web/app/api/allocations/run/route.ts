import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { runAllocationAlgorithm } from '@/lib/allocation-engine';

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dryRunParam = searchParams.get('dryRun');
  const dryRun = dryRunParam === 'true' || dryRunParam === '1';

  try {
    const result = runAllocationAlgorithm(dryRun, activeUser.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
