import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  res.cookies.set(SESSION_COOKIE, '', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 0,
  });

  return res;
}
