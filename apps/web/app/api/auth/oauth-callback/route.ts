import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';
import { supabaseUpsertUser } from '@/lib/supabase';
import { User } from '@unifest/shared';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = readDatabase();
    let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (user) {
      // Existing user: mark email verified since Google authenticated it
      user.emailVerified = true;
      if (name && (!user.name || user.name === cleanEmail)) {
        user.name = name.trim();
      }
      writeDatabase(db);
    } else {
      // New user from Google OAuth
      const newUser: User = {
        id: `usr-g-${Date.now()}`,
        name: name && name.trim().length > 0 ? name.trim() : cleanEmail.split('@')[0],
        email: cleanEmail,
        gender: 'MALE',
        role: 'STUDENT',
        collegeId: 'col-pce',
        emailVerified: true,
      };

      db.users.push(newUser);
      writeDatabase(db);
      user = newUser;
    }

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
