import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';
import { supabaseGetUserByEmail } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide both email and password' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = readDatabase();
    let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      const sbUser = await supabaseGetUserByEmail(cleanEmail);
      if (sbUser) {
        db.users.push(sbUser);
        writeDatabase(db);
        user = sbUser;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 401 });
    }

    // Verify password
    const expectedPassword = user.password || 'unifest123';
    if (password !== expectedPassword) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    // Check email verification status!
    if (!user.emailVerified) {
      // Ensure user has a verification code
      if (!user.verificationCode) {
        user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        writeDatabase(db);
      }

      return NextResponse.json(
        {
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Your email address is not verified yet. Please enter the verification code.',
          email: user.email,
          userId: user.id,
          codeHint: user.verificationCode,
        },
        { status: 403 }
      );
    }

    // Verified! Set session cookie
    const college = db.colleges.find((c) => c.id === user.collegeId);
    const userWithCollege = { ...user, college };

    const res = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
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
