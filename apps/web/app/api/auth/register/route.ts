import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { User, Role, Gender } from '@unifest/shared';
import { supabaseUpsertUser } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, gender, role, collegeId, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = readDatabase();

    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 400 });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      phone: phone || null,
      gender: (gender as Gender) || 'MALE',
      role: (role as Role) || 'STUDENT',
      collegeId: collegeId || (role === 'STUDENT' ? 'col-pce' : null),
      emailVerified: false,
      verificationCode,
    };

    db.users.push(newUser);
    writeDatabase(db);

    // Sync to Supabase in background
    supabaseUpsertUser(newUser).catch(() => {});

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      message: 'Account created! Please verify your email with the 6-digit code.',
      email: newUser.email,
      codeHint: verificationCode,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
