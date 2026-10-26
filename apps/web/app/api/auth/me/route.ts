import { NextResponse } from 'next/server';
import { getOptionalActiveUserAsync } from '@/lib/auth';
import { readDatabase } from '@/lib/db';

export async function GET() {
  const activeUser = await getOptionalActiveUserAsync();
  const db = readDatabase();
  const users = db.users.map((u) => {
    const col = db.colleges.find((c) => c.id === u.collegeId);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      gender: u.gender,
      role: u.role,
      emailVerified: u.emailVerified,
      college: col ? { code: col.code, name: col.name, color: col.color } : null,
    };
  });

  return NextResponse.json({
    user: activeUser,
    users,
  });
}
