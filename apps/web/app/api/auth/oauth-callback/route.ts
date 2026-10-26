import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';
import { supabaseUpsertUser } from '@/lib/supabase';
import { User } from '@unifest/shared';

export async function POST(req: NextRequest) {
  try {
    const { email, name, intent } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = readDatabase();
    let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Check Supabase if not in local cache
      const { supabaseGetUserByEmail } = await import('@/lib/supabase');
      const sbUser = await supabaseGetUserByEmail(cleanEmail);
      if (sbUser) {
        db.users.push(sbUser);
        writeDatabase(db);
        user = sbUser;
      }
    }

    if (!user) {
      if (intent === 'signup') {
        // Signing up with Google -> Create the account!
        const newUser: User = {
          id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          email: cleanEmail,
          name: name?.trim() || cleanEmail.split('@')[0],
          gender: 'MALE',
          role: 'STUDENT',
          collegeId: 'col-cgc-univ-mohali',
          collegeName: 'CGC University, Mohali',
          emailVerified: true,
          password: 'unifest_google_oauth',
          isProfileComplete: false,
        };
        db.users.push(newUser);
        writeDatabase(db);
        supabaseUpsertUser(newUser).catch(() => {});
        user = newUser;
      } else {
        // User clicked "Sign In with Google" without having an account first
        return NextResponse.json(
          {
            error: 'ACCOUNT_NOT_FOUND',
            message: 'No account found for this Google email. Please register your account first, then you can sign in with Google.',
            email: cleanEmail,
          },
          { status: 404 }
        );
      }
    }

    // Existing user: mark email verified since Google authenticated it
    user.emailVerified = true;
    if (name && (!user.name || user.name === cleanEmail)) {
      user.name = name.trim();
    }
    writeDatabase(db);

    // Sync to Supabase in background
    supabaseUpsertUser(user).catch(() => {});

    const college = db.colleges.find((c) => c.id === user?.collegeId);
    const userWithCollege = { ...user, college };

    const res = NextResponse.json({
      success: true,
      message: `Signed in as ${user.name}!`,
      user: userWithCollege,
    });

    // Set 7-day session cookie
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
