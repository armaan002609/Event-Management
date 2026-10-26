import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'ADMIN' && activeUser.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const actionFilter = searchParams.get('action');
  const entityFilter = searchParams.get('entity');

  const db = readDatabase();
  let logs = db.auditLogs;

  if (actionFilter) {
    logs = logs.filter((l) => l.action.toLowerCase().includes(actionFilter.toLowerCase()));
  }
  if (entityFilter) {
    logs = logs.filter((l) => l.entity.toLowerCase().includes(entityFilter.toLowerCase()));
  }

  return NextResponse.json(logs);
}
