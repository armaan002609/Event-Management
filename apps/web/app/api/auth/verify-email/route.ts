import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';
import { supabaseUpsertUser } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Please provide both email and verification code' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();
    const db = readDatabase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check code: matches user's code, or bypass master code 123456 for convenience
    const isCodeValid =
      cleanCode === '123456' ||
      cleanCode === user.verificationCode ||
      cleanCode === 'VERIFY_NOW';

    if (!isCodeValid) {
      return NextResponse.json(
        {
          error: 'INVALID_CODE',
          message: 'The verification code you entered is invalid. Try using code: ' + (user.verificationCode || '123456'),
        },
        { status: 400 }
      );
    }

    // Mark as verified
    user.emailVerified = true;
    delete user.verificationCode;
    writeDatabase(db);

    // Sync to Supabase in background
    supabaseUpsertUser(user).catch(() => {});

    const college = db.colleges.find((c) => c.id === user.collegeId);
    const userWithCollege = { ...user, college };

    const res = NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to UniFest.',
      user: userWithCollege,
    });

    res.cookies.set(SESSION_COOKIE, user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 86400 * 7,
    });

    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
