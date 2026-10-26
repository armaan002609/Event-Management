import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser, getOptionalActiveUser } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/db';
import { supabaseUpsertUser } from '@/lib/supabase';
import { isUserProfileComplete } from '@unifest/shared';

export async function GET() {
  const user = getOptionalActiveUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isComplete = isUserProfileComplete(user);
  return NextResponse.json({
    user: {
      ...user,
      isProfileComplete: isComplete,
    },
    isProfileComplete: isComplete,
  });
}

export async function POST(req: NextRequest) {
  try {
    const activeUser = getOptionalActiveUser();
    if (!activeUser) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      fatherPhone,
      address,
      collegeId,
      collegeName,
      rollNo,
      course,
      passingYear,
      avatarUrl,
      gender,
    } = body;

    const db = readDatabase();
    const userIndex = db.users.findIndex((u) => u.id === activeUser.id);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    const existingUser = db.users[userIndex];

    // Update fields
    if (name) existingUser.name = name.trim();
    if (phone !== undefined) existingUser.phone = phone?.trim() || null;
    if (fatherPhone !== undefined) existingUser.fatherPhone = fatherPhone?.trim() || null;
    if (address !== undefined) existingUser.address = address?.trim() || null;
    if (collegeId !== undefined) existingUser.collegeId = collegeId || null;
    if (collegeName !== undefined) existingUser.collegeName = collegeName?.trim() || null;
    if (rollNo !== undefined) existingUser.rollNo = rollNo?.trim() || null;
    if (course !== undefined) existingUser.course = course?.trim() || null;
    if (passingYear !== undefined) existingUser.passingYear = passingYear || null;
    if (avatarUrl !== undefined) existingUser.avatarUrl = avatarUrl || null;
    if (gender !== undefined) existingUser.gender = gender;

    // Check completeness
    const complete = isUserProfileComplete(existingUser);
    existingUser.isProfileComplete = complete;

    db.users[userIndex] = existingUser;
    writeDatabase(db);

    // Sync to Supabase in background
    supabaseUpsertUser(existingUser).catch(() => {});

    const college = db.colleges.find((c) => c.id === existingUser.collegeId);
    const userWithCollege = { ...existingUser, college };

    return NextResponse.json({
      success: true,
      message: complete ? 'Profile completed successfully!' : 'Profile updated.',
      user: userWithCollege,
      isProfileComplete: complete,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
