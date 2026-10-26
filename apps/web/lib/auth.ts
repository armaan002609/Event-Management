import { cookies } from 'next/headers';
import { User } from '@unifest/shared';
import { readDatabase, writeDatabase } from './db';

export const SESSION_COOKIE = 'unifest_active_user_id';

export function getOptionalActiveUserId(): string | null {
  try {
    const cookieStore = cookies();
    const cookieVal = cookieStore.get(SESSION_COOKIE)?.value;
    if (cookieVal) return cookieVal;
  } catch {
    // If outside request context or cookies unavailable
  }
  return null;
}

export const ADMIN_EMAILS = ['armaan002609@gmail.com', 'admin@unifest.org'];

export function isAdminUser(user?: User | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || (!!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

export function getOptionalActiveUser(): User | null {
  const userId = getOptionalActiveUserId();
  if (!userId) return null;
  const db = readDatabase();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      user.role = 'ADMIN';
    }
    const college = db.colleges.find((c) => c.id === user.collegeId);
    return { ...user, college };
  }
  return null;
}

export async function getOptionalActiveUserAsync(): Promise<User | null> {
  const userId = getOptionalActiveUserId();
  if (!userId) return null;
  const db = readDatabase();
  let user = db.users.find((u) => u.id === userId);

  if (!user) {
    try {
      const { supabaseGetUserById } = await import('./supabase');
      const sbUser = await supabaseGetUserById(userId);
      if (sbUser) {
        if (sbUser.email && ADMIN_EMAILS.includes(sbUser.email.toLowerCase())) {
          sbUser.role = 'ADMIN';
        }
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
      // Supabase unavailable or mock mode
    }
  }

  if (user) {
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      user.role = 'ADMIN';
    }
    const college = db.colleges.find((c) => c.id === user.collegeId);
    return { ...user, college };
  }
  return null;
}

export function getActiveUserId(): string {
  const id = getOptionalActiveUserId();
  if (id) return id;
  return 'usr-aarav'; // Default fallback user ID
}

export function getActiveUser(): User {
  const optional = getOptionalActiveUser();
  if (optional) return optional;
  // Fallback to first user
  const db = readDatabase();
  const fallback = db.users[0];
  const college = db.colleges.find((c) => c.id === fallback.collegeId);
  return { ...fallback, college };
}

