import fs from 'fs';
import path from 'path';
import {
  College,
  User,
  Event,
  EventRegistration,
  Hostel,
  Room,
  Bed,
  RoomAllocation,
  QrTicket,
  CheckinLog,
  MealSlot,
  MealBatch,
  MealLog,
  ScanLog,
  NotificationLog,
  AuditLog,
} from '@unifest/shared';

export interface DatabaseSchema {
  colleges: College[];
  users: User[];
  events: Event[];
  registrations: EventRegistration[];
  hostels: Hostel[];
  rooms: Room[];
  beds: Bed[];
  allocations: RoomAllocation[];
  qrTickets: QrTicket[];
  checkinLogs: CheckinLog[];
  mealSlots: MealSlot[];
  mealBatches: MealBatch[];
  mealLogs: MealLog[];
  scanLogs: ScanLog[];
  notificationLogs: NotificationLog[];
  auditLogs: AuditLog[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

function ensureDataDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getInitialSeedData(): DatabaseSchema {
  const colleges: College[] = [
    { id: 'col-pce', name: 'Punjab College of Engineering', code: 'PCE', color: '#2563EB' },
    { id: 'col-lpu', name: 'Lovely Professional University', code: 'LPU', color: '#7C3AED' },
    { id: 'col-iitd', name: 'IIT Delhi', code: 'IITD', color: '#059669' },
    { id: 'col-du', name: 'Delhi University', code: 'DU', color: '#D97706' },
    { id: 'col-bits', name: 'BITS Pilani', code: 'BITS', color: '#DC2626' },
  ];

  const hostels: Hostel[] = [
    { id: 'hostel-boys-1', name: 'Aryabhatta Boys Hostel', gender: 'MALE' },
    { id: 'hostel-girls-1', name: 'Gargi Girls Hostel', gender: 'FEMALE' },
  ];

  const rooms: Room[] = [
    // Boys Hostel - Floor 1
    { id: 'room-b101', hostelId: 'hostel-boys-1', number: '101', floor: 1, capacity: 3, gender: 'MALE', lockedCollegeId: 'col-pce' },
    { id: 'room-b102', hostelId: 'hostel-boys-1', number: '102', floor: 1, capacity: 3, gender: 'MALE', lockedCollegeId: 'col-lpu' },
    // Boys Hostel - Floor 2
    { id: 'room-b201', hostelId: 'hostel-boys-1', number: '201', floor: 2, capacity: 2, gender: 'MALE', lockedCollegeId: null },
    { id: 'room-b202', hostelId: 'hostel-boys-1', number: '202', floor: 2, capacity: 4, gender: 'MALE', lockedCollegeId: null },

    // Girls Hostel - Floor 1
    { id: 'room-g101', hostelId: 'hostel-girls-1', number: '101', floor: 1, capacity: 3, gender: 'FEMALE', lockedCollegeId: 'col-du' },
    { id: 'room-g102', hostelId: 'hostel-girls-1', number: '102', floor: 1, capacity: 2, gender: 'FEMALE', lockedCollegeId: null },
    // Girls Hostel - Floor 2
    { id: 'room-g201', hostelId: 'hostel-girls-1', number: '201', floor: 2, capacity: 3, gender: 'FEMALE', lockedCollegeId: null },
    { id: 'room-g202', hostelId: 'hostel-girls-1', number: '202', floor: 2, capacity: 4, gender: 'FEMALE', lockedCollegeId: null },
  ];

  const beds: Bed[] = [
    // Room B101
    { id: 'bed-b101-1', roomId: 'room-b101', label: 'Bed A' },
    { id: 'bed-b101-2', roomId: 'room-b101', label: 'Bed B' },
    { id: 'bed-b101-3', roomId: 'room-b101', label: 'Bed C' },

    // Room B102
    { id: 'bed-b102-1', roomId: 'room-b102', label: 'Bed A' },
    { id: 'bed-b102-2', roomId: 'room-b102', label: 'Bed B' },
    { id: 'bed-b102-3', roomId: 'room-b102', label: 'Bed C' },

    // Room B201
    { id: 'bed-b201-1', roomId: 'room-b201', label: 'Bed A' },
    { id: 'bed-b201-2', roomId: 'room-b201', label: 'Bed B' },

    // Room B202
    { id: 'bed-b202-1', roomId: 'room-b202', label: 'Bed A' },
    { id: 'bed-b202-2', roomId: 'room-b202', label: 'Bed B' },
    { id: 'bed-b202-3', roomId: 'room-b202', label: 'Bed C' },
    { id: 'bed-b202-4', roomId: 'room-b202', label: 'Bed D' },

    // Room G101
    { id: 'bed-g101-1', roomId: 'room-g101', label: 'Bed A' },
    { id: 'bed-g101-2', roomId: 'room-g101', label: 'Bed B' },
    { id: 'bed-g101-3', roomId: 'room-g101', label: 'Bed C' },

    // Room G102
    { id: 'bed-g102-1', roomId: 'room-g102', label: 'Bed A' },
    { id: 'bed-g102-2', roomId: 'room-g102', label: 'Bed B' },

    // Room G201
    { id: 'bed-g201-1', roomId: 'room-g201', label: 'Bed A' },
    { id: 'bed-g201-2', roomId: 'room-g201', label: 'Bed B' },
    { id: 'bed-g201-3', roomId: 'room-g201', label: 'Bed C' },

    // Room G202
    { id: 'bed-g202-1', roomId: 'room-g202', label: 'Bed A' },
    { id: 'bed-g202-2', roomId: 'room-g202', label: 'Bed B' },
    { id: 'bed-g202-3', roomId: 'room-g202', label: 'Bed C' },
    { id: 'bed-g202-4', roomId: 'room-g202', label: 'Bed D' },
  ];

  const users: User[] = [
    // Students
    { id: 'usr-aarav', email: 'aarav.sharma@pce.edu', name: 'Aarav Sharma', phone: '+91 98765 43210', gender: 'MALE', role: 'STUDENT', collegeId: 'col-pce', emailVerified: true },
    { id: 'usr-amit', email: 'amit.verma@pce.edu', name: 'Amit Verma', phone: '+91 98765 43211', gender: 'MALE', role: 'STUDENT', collegeId: 'col-pce', emailVerified: true },
    { id: 'usr-priya', email: 'priya.singh@du.ac.in', name: 'Priya Singh', phone: '+91 98765 43212', gender: 'FEMALE', role: 'STUDENT', collegeId: 'col-du', emailVerified: true },
    { id: 'usr-rohit', email: 'rohit.kumar@lpu.co.in', name: 'Rohit Kumar', phone: '+91 98765 43213', gender: 'MALE', role: 'STUDENT', collegeId: 'col-lpu', emailVerified: true },
    { id: 'usr-sneha', email: 'sneha.patel@pce.edu', name: 'Sneha Patel', phone: '+91 98765 43214', gender: 'FEMALE', role: 'STUDENT', collegeId: 'col-pce', emailVerified: true },
    { id: 'usr-simran', email: 'simran.kaur@lpu.co.in', name: 'Simran Kaur', phone: '+91 98765 43215', gender: 'FEMALE', role: 'STUDENT', collegeId: 'col-lpu', emailVerified: true },
    { id: 'usr-kabir', email: 'kabir.mehta@iitd.ac.in', name: 'Kabir Mehta', phone: '+91 98765 43216', gender: 'MALE', role: 'STUDENT', collegeId: 'col-iitd', emailVerified: true },
    { id: 'usr-ananya', email: 'ananya.iyer@du.ac.in', name: 'Ananya Iyer', phone: '+91 98765 43217', gender: 'FEMALE', role: 'STUDENT', collegeId: 'col-du', emailVerified: true },
    { id: 'usr-divya', email: 'divya.joshi@bits.ac.in', name: 'Divya Joshi', phone: '+91 98765 43218', gender: 'FEMALE', role: 'STUDENT', collegeId: 'col-bits', emailVerified: true },

    // Staff
    { id: 'usr-manager', email: 'manager@unifest.org', name: 'Vikram Malhotra (Manager)', phone: '+91 99999 11111', gender: 'MALE', role: 'MANAGER', collegeId: null, emailVerified: true },
    { id: 'usr-scanner', email: 'scanner@unifest.org', name: 'Dev Raj (Hostel/Mess Scanner)', phone: '+91 99999 22222', gender: 'MALE', role: 'SCANNER', collegeId: null, emailVerified: true },
    { id: 'usr-admin', email: 'admin@unifest.org', name: 'Dr. Sunita Rao (System Admin)', phone: '+91 99999 33333', gender: 'FEMALE', role: 'ADMIN', collegeId: null, emailVerified: true },
  ];

  const allocations: RoomAllocation[] = [
    // Aarav and Amit in B101 (PCE, Male)
    { id: 'alloc-1', userId: 'usr-aarav', bedId: 'bed-b101-1', allocatedBy: 'SYSTEM', isOverride: false, createdAt: new Date().toISOString() },
    { id: 'alloc-2', userId: 'usr-amit', bedId: 'bed-b101-2', allocatedBy: 'SYSTEM', isOverride: false, createdAt: new Date().toISOString() },
    // Rohit in B102 (LPU, Male)
    { id: 'alloc-3', userId: 'usr-rohit', bedId: 'bed-b102-1', allocatedBy: 'SYSTEM', isOverride: false, createdAt: new Date().toISOString() },
    // Priya in G101 (DU, Female)
    { id: 'alloc-4', userId: 'usr-priya', bedId: 'bed-g101-1', allocatedBy: 'SYSTEM', isOverride: false, createdAt: new Date().toISOString() },
    // Ananya in G101 (DU, Female)
    { id: 'alloc-5', userId: 'usr-ananya', bedId: 'bed-g101-2', allocatedBy: 'SYSTEM', isOverride: false, createdAt: new Date().toISOString() },
  ];

  const checkinLogs: CheckinLog[] = [
    { id: 'chk-1', userId: 'usr-aarav', type: 'CHECK_IN', scannedBy: 'usr-scanner', at: new Date(Date.now() - 3600000 * 4).toISOString() },
    { id: 'chk-2', userId: 'usr-amit', type: 'CHECK_IN', scannedBy: 'usr-scanner', at: new Date(Date.now() - 3600000 * 3).toISOString() },
    { id: 'chk-3', userId: 'usr-priya', type: 'CHECK_IN', scannedBy: 'usr-scanner', at: new Date(Date.now() - 3600000 * 2).toISOString() },
  ];

  const qrTickets: QrTicket[] = users
    .filter((u) => u.role === 'STUDENT')
    .map((u, idx) => ({
      id: `ticket-${u.id}`,
      userId: u.id,
      tokenId: `jti-${u.id}-${idx + 100}`,
      version: 1,
      issuedAt: new Date().toISOString(),
    }));

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const events: Event[] = [
    {
      id: 'evt-1',
      title: 'Inter-College 100m Sprint Men',
      type: 'SPORTS',
      description: 'Men sprint finals. Top 8 qualifiers from preliminary college heats.',
      venue: 'Main Athletics Track, Sector 4',
      startsAt: new Date(now.getTime() + 3600000 * 2).toISOString(),
      endsAt: new Date(now.getTime() + 3600000 * 3.5).toISOString(),
      capacity: 16,
      status: 'SCHEDULED',
    },
    {
      id: 'evt-2',
      title: 'Punjab Folk Bhangra Championship',
      type: 'FOLK',
      description: 'Traditional Folk Dance group competition. Live Dhol accompaniment.',
      venue: 'Open Air Amphitheatre',
      startsAt: new Date(now.getTime() + 3600000 * 4).toISOString(),
      endsAt: new Date(now.getTime() + 3600000 * 7).toISOString(),
      capacity: 30,
      status: 'SCHEDULED',
    },
    {
      id: 'evt-3',
      title: 'Badminton Singles Men & Women',
      type: 'SPORTS',
      description: 'Knockout tournament under BWF standard tournament rules.',
      venue: 'Indoor Badminton Arena, Court 1 & 2',
      startsAt: new Date(now.getTime() + 3600000 * 24).toISOString(),
      endsAt: new Date(now.getTime() + 3600000 * 28).toISOString(),
      capacity: 24,
      status: 'SCHEDULED',
    },
    {
      id: 'evt-4',
      title: 'Ghazal & Sufi Fusion Night',
      type: 'FOLK',
      description: 'Classical and contemporary Sufi vocal performances by college troupes.',
      venue: 'Central Auditorium Hall',
      startsAt: new Date(now.getTime() + 3600000 * 29).toISOString(),
      endsAt: new Date(now.getTime() + 3600000 * 33).toISOString(),
      capacity: 200,
      status: 'SCHEDULED',
    },
    {
      id: 'evt-5',
      title: 'Inter-College Football 7s',
      type: 'SPORTS',
      description: 'High-intensity 7-a-side football tournament.',
      venue: 'West Campus Sports Ground',
      startsAt: new Date(now.getTime() + 3600000 * 48).toISOString(),
      endsAt: new Date(now.getTime() + 3600000 * 54).toISOString(),
      capacity: 40,
      status: 'SCHEDULED',
    },
  ];

  const registrations: EventRegistration[] = [
    { id: 'reg-1', userId: 'usr-aarav', eventId: 'evt-1', status: 'CONFIRMED' },
    { id: 'reg-2', userId: 'usr-aarav', eventId: 'evt-2', status: 'CONFIRMED' },
    { id: 'reg-3', userId: 'usr-amit', eventId: 'evt-1', status: 'CONFIRMED' },
    { id: 'reg-4', userId: 'usr-priya', eventId: 'evt-2', status: 'CONFIRMED' },
    { id: 'reg-5', userId: 'usr-priya', eventId: 'evt-4', status: 'CONFIRMED' },
    { id: 'reg-6', userId: 'usr-sneha', eventId: 'evt-2', status: 'CONFIRMED' },
    { id: 'reg-7', userId: 'usr-rohit', eventId: 'evt-1', status: 'CONFIRMED' },
  ];

  const mealSlots: MealSlot[] = [
    { id: 'slot-breakfast-1', date: todayStr, type: 'BREAKFAST' },
    { id: 'slot-lunch-1', date: todayStr, type: 'LUNCH' },
    { id: 'slot-dinner-1', date: todayStr, type: 'DINNER' },
  ];

  const mealBatches: MealBatch[] = [
    // Lunch batches for today
    {
      id: 'batch-lunch-pce-m',
      slotId: 'slot-lunch-1',
      collegeId: 'col-pce',
      gender: 'MALE',
      startsAt: new Date(now.getTime() - 1800000).toISOString(),
      endsAt: new Date(now.getTime() + 1800000).toISOString(), // currently active!
    },
    {
      id: 'batch-lunch-pce-f',
      slotId: 'slot-lunch-1',
      collegeId: 'col-pce',
      gender: 'FEMALE',
      startsAt: new Date(now.getTime() - 1800000).toISOString(),
      endsAt: new Date(now.getTime() + 1800000).toISOString(),
    },
    {
      id: 'batch-lunch-lpu-m',
      slotId: 'slot-lunch-1',
      collegeId: 'col-lpu',
      gender: 'MALE',
      startsAt: new Date(now.getTime() + 1800000).toISOString(),
      endsAt: new Date(now.getTime() + 5400000).toISOString(),
    },
    {
      id: 'batch-lunch-du-f',
      slotId: 'slot-lunch-1',
      collegeId: 'col-du',
      gender: 'FEMALE',
      startsAt: new Date(now.getTime() - 900000).toISOString(),
      endsAt: new Date(now.getTime() + 2700000).toISOString(),
    },
  ];

  const mealLogs: MealLog[] = [
    {
      id: 'mlog-1',
      userId: 'usr-amit',
      slotId: 'slot-lunch-1',
      batchId: 'batch-lunch-pce-m',
      scannedBy: 'usr-scanner',
      isException: false,
      at: new Date(now.getTime() - 600000).toISOString(),
    },
  ];

  const scanLogs: ScanLog[] = [
    {
      id: 'scan-1',
      ticketId: 'ticket-usr-aarav',
      userId: 'usr-aarav',
      context: 'HOSTEL_CHECKIN',
      result: 'ALLOWED',
      scannedBy: 'usr-scanner',
      deviceInfo: 'Hostel Main Gate Scanner #1',
      at: new Date(now.getTime() - 3600000 * 4).toISOString(),
      userName: 'Aarav Sharma',
      collegeCode: 'PCE',
    },
    {
      id: 'scan-2',
      ticketId: 'ticket-usr-amit',
      userId: 'usr-amit',
      context: 'MEAL',
      result: 'ALLOWED',
      scannedBy: 'usr-scanner',
      deviceInfo: 'Mess Counter #2',
      at: new Date(now.getTime() - 600000).toISOString(),
      userName: 'Amit Verma',
      collegeCode: 'PCE',
    },
  ];

  const notificationLogs: NotificationLog[] = [
    {
      id: 'notif-1',
      userId: 'usr-aarav',
      userEmail: 'aarav.sharma@pce.edu',
      userName: 'Aarav Sharma',
      type: 'ROOM_ALLOCATED',
      subject: 'Hostel Room Confirmed: Aryabhatta Boys Hostel - Room 101, Bed A',
      body: 'Your accommodation has been confirmed. Please present your personal UniFest QR at the hostel reception upon arrival.',
      status: 'SENT',
      attempts: 1,
      createdAt: new Date(now.getTime() - 3600000 * 6).toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'usr-aarav',
      userEmail: 'aarav.sharma@pce.edu',
      userName: 'Aarav Sharma',
      type: 'EVENT_REGISTRATION',
      subject: 'Registration Confirmed: Inter-College 100m Sprint Men',
      body: 'You are registered for 100m Sprint Men. Starts at 4:30 PM at Main Athletics Track.',
      status: 'SENT',
      eventId: 'evt-1',
      attempts: 1,
      createdAt: new Date(now.getTime() - 3600000 * 5).toISOString(),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit-1',
      actorId: 'usr-admin',
      actorName: 'Dr. Sunita Rao (System Admin)',
      action: 'SYSTEM_INITIALIZE',
      entity: 'FESTIVAL_SYSTEM',
      entityId: 'UNIFEST_2026',
      reason: 'Initialized UniFest 2026 platform with core colleges and hostels inventory.',
      before: null,
      after: { festival: 'UniFest 2026', collegesCount: 5, hostelsCount: 2 },
      at: new Date(now.getTime() - 3600000 * 24).toISOString(),
    },
    {
      id: 'audit-2',
      actorId: 'usr-manager',
      actorName: 'Vikram Malhotra (Manager)',
      action: 'AUTO_ALLOCATION_RUN',
      entity: 'HOSTEL_ALLOCATION',
      entityId: 'run-batch-1',
      reason: 'Executed auto-allocation batch for verified participants.',
      before: null,
      after: { allocated: 5, unallocated: 4 },
      at: new Date(now.getTime() - 3600000 * 6).toISOString(),
    },
  ];

  return {
    colleges,
    users,
    events,
    registrations,
    hostels,
    rooms,
    beds,
    allocations,
    qrTickets,
    checkinLogs,
    mealSlots,
    mealBatches,
    mealLogs,
    scanLogs,
    notificationLogs,
    auditLogs,
  };
}

export function readDatabase(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const seed = getInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning initial seed data', err);
    return getInitialSeedData();
  }
}

export function writeDatabase(data: DatabaseSchema): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function resetDatabase(): DatabaseSchema {
  ensureDataDir();
  const seed = getInitialSeedData();
  fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
  return seed;
}
