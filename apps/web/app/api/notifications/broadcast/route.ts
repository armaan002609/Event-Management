import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { emitDomainNotification } from '@/lib/notification-service';

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  if (activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { audienceType, collegeId, gender, eventId, subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: 'subject and message are required' }, { status: 400 });
    }

    const payload = {
      subject,
      message,
      collegeId: audienceType === 'COLLEGE' ? collegeId : undefined,
      gender: audienceType === 'GENDER' ? gender : undefined,
      eventId: audienceType === 'EVENT' ? eventId : undefined,
    };

    const result = emitDomainNotification('BROADCAST', payload, activeUser.name);

    return NextResponse.json({
      success: true,
      message: `Broadcast sent to ${result.studentsNotified} students and ${result.managersNotified} managers.`,
      result,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
