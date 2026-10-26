import { NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { readDatabase } from '@/lib/db';

export async function GET() {
  const activeUser = getActiveUser();
  const db = readDatabase();

  let userLogs = db.notificationLogs;
  // If student, filter ONLY their own notifications (BR-9)
  if (activeUser.role === 'STUDENT') {
    userLogs = userLogs.filter((n) => n.userId === activeUser.id);
  }

  return NextResponse.json(userLogs.slice(0, 50));
}
