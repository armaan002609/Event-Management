import { cookies } from 'next/headers';
import { User } from '@unifest/shared';
import { readDatabase } from './db';

const SESSION_COOKIE = 'unifest_active_user_id';

export function getActiveUserId(): string {
  try {
    const cookieStore = cookies();
    const cookieVal = cookieStore.get(SESSION_COOKIE)?.value;
    if (cookieVal) return cookieVal;
  } catch {
    // If outside request context or cookies unavailable
  }
  return 'usr-aarav'; // Default demo student
}

export function getActiveUser(): User {
  const userId = getActiveUserId();
  const db = readDatabase();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    const college = db.colleges.find((c) => c.id === user.collegeId);
    return { ...user, college };
  }
  // Fallback to Aarav
  const fallback = db.users[0];
  const college = db.colleges.find((c) => c.id === fallback.collegeId);
  return { ...fallback, college };
}
