import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { User } from '@unifest/shared';
import { readDatabase, writeDatabase } from './db';

export const SESSION_COOKIE = 'unifest_active_user_id';

const MASTER_ADMIN_EMAILS = ['armaankapoor2609@gmail.com', 'armaan002609@gmail.com'];

export function getOptionalActiveUserId(req?: NextRequest | Request): string | null {
  if (req) {
    try {
      if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
        const val = (req as any).cookies.get(SESSION_COOKIE)?.value;
        if (val) return val;
      }
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
        if (match && match[1]) return decodeURIComponent(match[1]);
      }
    } catch {}
  }
  try {
    const cookieStore = cookies();
    const cookieVal = cookieStore.get(SESSION_COOKIE)?.value;
    if (cookieVal) return cookieVal;
  } catch {
    // If outside request context or cookies unavailable
  }
  return null;
}

// Admin status is assigned strictly from the database (users.role === 'ADMIN')
export function isAdminUser(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN';
}

export function getOptionalActiveUser(req?: NextRequest | Request): User | null {
  const userId = getOptionalActiveUserId(req);
  if (!userId) return null;
  const db = readDatabase();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    const college = db.colleges.find((c) => c.id === user.collegeId);
    return { ...user, college };
  }
  return null;
}

export async function getOptionalActiveUserAsync(req?: NextRequest | Request): Promise<User | null> {
  const userId = getOptionalActiveUserId(req);
  if (!userId) return null;
  const db = readDatabase();
  let user = db.users.find((u) => u.id === userId);

  // Authoritatively fetch latest role and profile from Supabase database
  try {
    const { supabaseGetUserById } = await import('./supabase');
    const sbUser = await supabaseGetUserById(userId);
    if (sbUser) {
      const existingIdx = db.users.findIndex((u) => u.id === sbUser.id);
      if (existingIdx >= 0) {
        db.users[existingIdx] = sbUser;
      } else {
        db.users.push(sbUser);
      }
      writeDatabase(db);
      user = sbUser;
    }
  } catch {
    // Supabase unavailable, fallback to db.json
  }

  if (user) {
    const college = db.colleges.find((c) => c.id === user.collegeId);
    return { ...user, college };
  }
  return null;
}

export function getActiveUserId(req?: NextRequest | Request): string {
  const id = getOptionalActiveUserId(req);
  if (id) return id;
  const db = readDatabase();
  return db.users[0]?.id || 'usr-guest';
}

export function getActiveUser(req?: NextRequest | Request): User {
  const optional = getOptionalActiveUser(req);
  if (optional) return optional;
  const db = readDatabase();
  const fallback = db.users[0];
  if (!fallback) {
    return {
      id: 'usr-guest',
      email: 'guest@unifest.org',
      name: 'Guest User',
      gender: 'MALE',
      role: 'STUDENT',
      emailVerified: false,
    };
  }
  const college = db.colleges.find((c) => c.id === fallback.collegeId);
  return { ...fallback, college };
}


