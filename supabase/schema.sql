-- ==============================================================================
-- UNIFEST 2026 - SUPABASE POSTGRESQL COMPLETE DATABASE SCHEMA & INITIAL SEED
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. COLLEGES TABLE
CREATE TABLE IF NOT EXISTS colleges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  color TEXT
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
  role TEXT NOT NULL CHECK (role IN ('STUDENT', 'MANAGER', 'SCANNER', 'ADMIN')),
  college_id TEXT REFERENCES colleges(id) ON DELETE SET NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password TEXT DEFAULT 'unifest123',
  verification_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SPORTS', 'FOLK')),
  description TEXT,
  venue TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INT DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'POSTPONED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EVENT REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- 5. HOSTELS TABLE
CREATE TABLE IF NOT EXISTS hostels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE'))
);

-- 6. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  hostel_id TEXT NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  capacity INT NOT NULL DEFAULT 2,
  gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
  locked_college_id TEXT REFERENCES colleges(id) ON DELETE SET NULL
);

-- 7. BEDS TABLE
CREATE TABLE IF NOT EXISTS beds (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  label TEXT NOT NULL
);

-- 8. ROOM ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS allocations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bed_id TEXT NOT NULL UNIQUE REFERENCES beds(id) ON DELETE CASCADE,
  allocated_by TEXT NOT NULL DEFAULT 'SYSTEM',
  is_override BOOLEAN DEFAULT FALSE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. QR TICKETS TABLE
CREATE TABLE IF NOT EXISTS qr_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- 10. CHECK-IN LOGS TABLE
CREATE TABLE IF NOT EXISTS checkin_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CHECK_IN', 'CHECK_OUT')),
  scanned_by TEXT,
  at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MEAL SLOTS TABLE
CREATE TABLE IF NOT EXISTS meal_slots (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'))
);

-- 12. MEAL BATCHES TABLE
CREATE TABLE IF NOT EXISTS meal_batches (
  id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL REFERENCES meal_slots(id) ON DELETE CASCADE,
  college_id TEXT REFERENCES colleges(id) ON DELETE SET NULL,
  gender TEXT CHECK (gender IN ('MALE', 'FEMALE')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL
);

-- 13. MEAL LOGS TABLE
CREATE TABLE IF NOT EXISTS meal_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL REFERENCES meal_slots(id) ON DELETE CASCADE,
  batch_id TEXT REFERENCES meal_batches(id) ON DELETE SET NULL,
  scanned_by TEXT,
  is_exception BOOLEAN DEFAULT FALSE,
  at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SCAN LOGS TABLE
CREATE TABLE IF NOT EXISTS scan_logs (
  id TEXT PRIMARY KEY,
  ticket_id TEXT,
  user_id TEXT,
  user_name TEXT,
  college_code TEXT,
  context TEXT NOT NULL,
  result TEXT NOT NULL,
  scanned_by TEXT,
  device_info TEXT,
  at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. NOTIFICATION LOGS TABLE
CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SENT',
  event_id TEXT,
  attempts INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT,
  before JSONB,
  after JSONB,
  at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Allow full access for anon/authenticated roles to support API route operations

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for colleges" ON colleges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for registrations" ON registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for hostels" ON hostels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for beds" ON beds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for allocations" ON allocations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for qr_tickets" ON qr_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for checkin_logs" ON checkin_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for meal_slots" ON meal_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for meal_batches" ON meal_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for meal_logs" ON meal_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for scan_logs" ON scan_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for notification_logs" ON notification_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Colleges
INSERT INTO colleges (id, name, code, color) VALUES
  ('col-pce', 'Punjab College of Engineering', 'PCE', '#2563EB'),
  ('col-lpu', 'Lovely Professional University', 'LPU', '#7C3AED'),
  ('col-iitd', 'IIT Delhi', 'IITD', '#059669'),
  ('col-du', 'Delhi University', 'DU', '#D97706'),
  ('col-bits', 'BITS Pilani', 'BITS', '#DC2626')
ON CONFLICT (id) DO NOTHING;

-- Hostels
INSERT INTO hostels (id, name, gender) VALUES
  ('hostel-boys-1', 'Aryabhatta Boys Hostel', 'MALE'),
  ('hostel-girls-1', 'Gargi Girls Hostel', 'FEMALE')
ON CONFLICT (id) DO NOTHING;

-- Rooms
INSERT INTO rooms (id, hostel_id, number, floor, capacity, gender, locked_college_id) VALUES
  ('room-b101', 'hostel-boys-1', '101', 1, 3, 'MALE', 'col-pce'),
  ('room-b102', 'hostel-boys-1', '102', 1, 3, 'MALE', 'col-lpu'),
  ('room-b201', 'hostel-boys-1', '201', 2, 2, 'MALE', NULL),
  ('room-b202', 'hostel-boys-1', '202', 2, 4, 'MALE', NULL),
  ('room-g101', 'hostel-girls-1', '101', 1, 3, 'FEMALE', 'col-du'),
  ('room-g102', 'hostel-girls-1', '102', 1, 2, 'FEMALE', NULL),
  ('room-g201', 'hostel-girls-1', '201', 2, 3, 'FEMALE', NULL),
  ('room-g202', 'hostel-girls-1', '202', 2, 4, 'FEMALE', NULL)
ON CONFLICT (id) DO NOTHING;

-- Beds
INSERT INTO beds (id, room_id, label) VALUES
  ('bed-b101-1', 'room-b101', 'Bed A'),
  ('bed-b101-2', 'room-b101', 'Bed B'),
  ('bed-b101-3', 'room-b101', 'Bed C'),
  ('bed-b102-1', 'room-b102', 'Bed A'),
  ('bed-b102-2', 'room-b102', 'Bed B'),
  ('bed-b102-3', 'room-b102', 'Bed C'),
  ('bed-b201-1', 'room-b201', 'Bed A'),
  ('bed-b201-2', 'room-b201', 'Bed B'),
  ('bed-b202-1', 'room-b202', 'Bed A'),
  ('bed-b202-2', 'room-b202', 'Bed B'),
  ('bed-b202-3', 'room-b202', 'Bed C'),
  ('bed-b202-4', 'room-b202', 'Bed D'),
  ('bed-g101-1', 'room-g101', 'Bed A'),
  ('bed-g101-2', 'room-g101', 'Bed B'),
  ('bed-g101-3', 'room-g101', 'Bed C'),
  ('bed-g102-1', 'room-g102', 'Bed A'),
  ('bed-g102-2', 'room-g102', 'Bed B'),
  ('bed-g201-1', 'room-g201', 'Bed A'),
  ('bed-g201-2', 'room-g201', 'Bed B'),
  ('bed-g201-3', 'room-g201', 'Bed C'),
  ('bed-g202-1', 'room-g202', 'Bed A'),
  ('bed-g202-2', 'room-g202', 'Bed B'),
  ('bed-g202-3', 'room-g202', 'Bed C'),
  ('bed-g202-4', 'room-g202', 'Bed D')
ON CONFLICT (id) DO NOTHING;

-- Staff Users
INSERT INTO users (id, email, name, phone, gender, role, college_id, email_verified, password) VALUES
  ('usr-manager', 'manager@unifest.org', 'Vikram Malhotra (Manager)', '+91 99999 11111', 'MALE', 'MANAGER', NULL, true, 'unifest123'),
  ('usr-scanner', 'scanner@unifest.org', 'Dev Raj (Hostel/Mess Scanner)', '+91 99999 22222', 'MALE', 'SCANNER', NULL, true, 'unifest123'),
  ('usr-admin', 'admin@unifest.org', 'Dr. Sunita Rao (System Admin)', '+91 99999 33333', 'FEMALE', 'ADMIN', NULL, true, 'unifest123')
ON CONFLICT (id) DO NOTHING;

-- Events
INSERT INTO events (id, title, type, description, venue, starts_at, ends_at, capacity, status) VALUES
  ('evt-1', 'Inter-College 100m Sprint Men', 'SPORTS', 'Men sprint finals. Top 8 qualifiers from preliminary college heats.', 'Main Athletics Track, Sector 4', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3.5 hours', 16, 'SCHEDULED'),
  ('evt-2', 'Punjab Folk Bhangra Championship', 'FOLK', 'Traditional Folk Dance group competition. Live Dhol accompaniment.', 'Open Air Amphitheatre', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '7 hours', 30, 'SCHEDULED'),
  ('evt-3', 'Badminton Singles Men & Women', 'SPORTS', 'Knockout tournament under BWF standard tournament rules.', 'Indoor Badminton Arena, Court 1 & 2', NOW() + INTERVAL '1 day', NOW() + INTERVAL '28 hours', 24, 'SCHEDULED'),
  ('evt-4', 'Ghazal & Sufi Fusion Night', 'FOLK', 'Classical and contemporary Sufi vocal performances by college troupes.', 'Central Auditorium Hall', NOW() + INTERVAL '29 hours', NOW() + INTERVAL '33 hours', 200, 'SCHEDULED'),
  ('evt-5', 'Inter-College Football 7s', 'SPORTS', 'High-intensity 7-a-side football tournament.', 'West Campus Sports Ground', NOW() + INTERVAL '2 days', NOW() + INTERVAL '54 hours', 40, 'SCHEDULED')
ON CONFLICT (id) DO NOTHING;

-- Meal Slots for Today
INSERT INTO meal_slots (id, date, type) VALUES
  ('slot-breakfast-1', TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), 'BREAKFAST'),
  ('slot-lunch-1', TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), 'LUNCH'),
  ('slot-dinner-1', TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), 'DINNER')
ON CONFLICT (id) DO NOTHING;

-- Lunch Batches
INSERT INTO meal_batches (id, slot_id, college_id, gender, starts_at, ends_at) VALUES
  ('batch-lunch-pce-m', 'slot-lunch-1', 'col-pce', 'MALE', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes'),
  ('batch-lunch-pce-f', 'slot-lunch-1', 'col-pce', 'FEMALE', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes'),
  ('batch-lunch-lpu-m', 'slot-lunch-1', 'col-lpu', 'MALE', NOW() + INTERVAL '30 minutes', NOW() + INTERVAL '90 minutes'),
  ('batch-lunch-du-f', 'slot-lunch-1', 'col-du', 'FEMALE', NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '45 minutes')
ON CONFLICT (id) DO NOTHING;
