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

// ─── USER OPERATIONS ──────────────────────────────────────────────

export async function supabaseUpsertUser(user: User): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('users').upsert({
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
    }, { onConflict: 'id' });
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
      gender: data.gender,
      role: data.role,
      collegeId: data.college_id,
      college: data.college,
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
