import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Event, EventRegistration, RoomAllocation, MealLog, ScanLog, AuditLog } from '@unifest/shared';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!cachedClient && supabaseUrl && supabaseKey) {
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return cachedClient;
}

let cachedBrowserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (!cachedBrowserClient) {
    cachedBrowserClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return cachedBrowserClient;
}

// ─── USER OPERATIONS ──────────────────────────────────────────────

export async function supabaseUpsertUser(user: User): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const userPayload: any = {
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      phone: user.phone || null,
      gender: user.gender,
      role: user.role,
      college_id: user.collegeId || null,
      email_verified: user.emailVerified ?? false,
      password: user.password || 'unifest123',
      verification_code: user.verificationCode || null,
    };

    if (user.fatherName !== undefined) userPayload.father_name = user.fatherName;
    if (user.fatherPhone !== undefined) userPayload.father_phone = user.fatherPhone;
    if (user.address !== undefined) userPayload.address = user.address;
    if (user.collegeName !== undefined) userPayload.college_name = user.collegeName;
    if (user.rollNo !== undefined) userPayload.roll_no = user.rollNo;
    if (user.course !== undefined) userPayload.course = user.course;
    if (user.passingYear !== undefined) userPayload.passing_year = user.passingYear;
    if (user.avatarUrl !== undefined) userPayload.avatar_url = user.avatarUrl;
    if (user.isProfileComplete !== undefined) userPayload.is_profile_complete = user.isProfileComplete;

    let { error } = await sb.from('users').upsert(userPayload, { onConflict: 'id' });
    if (error && error.message.includes('column')) {
      // Fallback to core columns if optional profile columns not yet added to Supabase
      const corePayload = {
        id: user.id,
        email: user.email.toLowerCase(),
        name: user.name,
        phone: user.phone || null,
        gender: user.gender,
        role: user.role,
        college_id: user.collegeId || null,
        email_verified: user.emailVerified ?? false,
        password: user.password || 'unifest123',
        verification_code: user.verificationCode || null,
      };
      const retry = await sb.from('users').upsert(corePayload, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      console.warn('Supabase upsertUser warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertUser network error:', err);
    return false;
  }
}

export async function supabaseGetUserByEmail(email: string): Promise<User | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('users')
      .select('*, college:colleges(*)')
      .eq('email', email.trim().toLowerCase())
      .single();
    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      fatherName: data.father_name || null,
      fatherPhone: data.father_phone || null,
      address: data.address || null,
      collegeId: data.college_id,
      collegeName: data.college_name || data.college?.name || null,
      college: data.college,
      rollNo: data.roll_no || null,
      course: data.course || null,
      passingYear: data.passing_year || null,
      avatarUrl: data.avatar_url || null,
      isProfileComplete: data.is_profile_complete || false,
      gender: data.gender,
      role: data.role,
      emailVerified: data.email_verified,
      password: data.password,
      verificationCode: data.verification_code,
    };
  } catch {
    return null;
  }
}

// ─── REGISTRATION OPERATIONS ──────────────────────────────────────

export async function supabaseUpsertRegistration(reg: EventRegistration): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('registrations').upsert({
      id: reg.id,
      user_id: reg.userId,
      event_id: reg.eventId,
      status: reg.status || 'CONFIRMED',
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

// ─── ALLOCATION OPERATIONS ────────────────────────────────────────

export async function supabaseUpsertAllocation(alloc: RoomAllocation): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('allocations').upsert({
      id: alloc.id,
      user_id: alloc.userId,
      bed_id: alloc.bedId,
      allocated_by: alloc.allocatedBy,
      is_override: alloc.isOverride,
      reason: alloc.reason || null,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

// ─── MEAL & SCAN LOG OPERATIONS ───────────────────────────────────

export async function supabaseInsertMealLog(log: MealLog): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('meal_logs').insert({
      id: log.id,
      user_id: log.userId,
      slot_id: log.slotId,
      batch_id: log.batchId || null,
      scanned_by: log.scannedBy,
      is_exception: log.isException,
      at: log.at,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function supabaseInsertScanLog(log: ScanLog): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('scan_logs').insert({
      id: log.id,
      ticket_id: log.ticketId || null,
      user_id: log.userId || null,
      user_name: log.userName || null,
      college_code: log.collegeCode || null,
      context: log.context,
      result: log.result,
      scanned_by: log.scannedBy,
      device_info: log.deviceInfo || null,
      at: log.at,
    });
    return !error;
  } catch {
    return false;
  }
}

// ─── AUDIT LOG OPERATIONS ─────────────────────────────────────────

export async function supabaseInsertAuditLog(log: AuditLog): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('audit_logs').insert({
      id: log.id,
      actor_id: log.actorId,
      actor_name: log.actorName,
      action: log.action,
      entity: log.entity,
      entity_id: log.entityId,
      reason: log.reason || null,
      before: log.before || null,
      after: log.after || null,
      at: log.at,
    });
    return !error;
  } catch {
    return false;
  }
}
