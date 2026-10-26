import { NextRequest, NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    const db = readDatabase();
    const targetUser = db.users.find((u) => u.id === userId);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const college = db.colleges.find((c) => c.id === targetUser.collegeId);
    const userWithCollege = { ...targetUser, college };

    const res = NextResponse.json({
      success: true,
      user: userWithCollege,
    });

    res.cookies.set('unifest_active_user_id', targetUser.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 86400 * 7,
    });

    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
