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

declare global {
  // eslint-disable-next-line no-var
  var __UNIFEST_IN_MEMORY_DB__: DatabaseSchema | undefined;
}

const LOCAL_DB_FILE = path.join(process.cwd(), 'data', 'db.json');

function isServerlessEnvironment(): boolean {
  return Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );
}

function getWritableDbFilePath(): string {
  if (isServerlessEnvironment()) {
    return '/tmp/unifest_db.json';
  }
  return LOCAL_DB_FILE;
}

function getFallbackTmpPath(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.TEMP || process.env.TMP || 'C:\\Temp', 'unifest_db.json');
  }
  return '/tmp/unifest_db.json';
}

function safeWriteToDisk(filePath: string, content: string): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (err: any) {
    const fallback = getFallbackTmpPath();
    if (filePath !== fallback) {
      try {
        const tmpDir = path.dirname(fallback);
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        fs.writeFileSync(fallback, content, 'utf-8');
        return true;
      } catch {
        // Fallback write failed, keep in-memory
      }
    }
    console.warn(`Could not persist db to disk (${err?.code || err?.message}). Keeping state in memory.`);
    return false;
  }
}

export function getInitialSeedData(): DatabaseSchema {
  const colleges: College[] = [
    { id: 'col-cgc-univ-mohali', name: 'CGC University, Mohali', code: 'CGC', color: '#D97706' },
  ];

  const hostels: Hostel[] = [
    { id: 'hostel-boys-1', name: 'Aryabhatta Boys Hostel', gender: 'MALE' },
    { id: 'hostel-girls-1', name: 'Gargi Girls Hostel', gender: 'FEMALE' },
  ];

  const rooms: Room[] = [
    // Boys Hostel - Floor 1
    { id: 'room-b101', hostelId: 'hostel-boys-1', number: '101', floor: 1, capacity: 3, gender: 'MALE', lockedCollegeId: null },
    { id: 'room-b102', hostelId: 'hostel-boys-1', number: '102', floor: 1, capacity: 3, gender: 'MALE', lockedCollegeId: null },
    // Boys Hostel - Floor 2
    { id: 'room-b201', hostelId: 'hostel-boys-1', number: '201', floor: 2, capacity: 2, gender: 'MALE', lockedCollegeId: null },
    { id: 'room-b202', hostelId: 'hostel-boys-1', number: '202', floor: 2, capacity: 4, gender: 'MALE', lockedCollegeId: null },

    // Girls Hostel - Floor 1
    { id: 'room-g101', hostelId: 'hostel-girls-1', number: '101', floor: 1, capacity: 3, gender: 'FEMALE', lockedCollegeId: null },
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
    {
      id: 'usr-g-1793019998926',
      email: 'armaan002609@gmail.com',
      name: 'Armaan',
      phone: '',
      gender: 'MALE',
      role: 'ADMIN',
      collegeId: 'col-cgc-univ-mohali',
      collegeName: 'CGC University, Mohali',
      emailVerified: true,
      password: 'unifest_google_oauth',
    },
  ];

  const allocations: RoomAllocation[] = [];
  const checkinLogs: CheckinLog[] = [];
  const qrTickets: QrTicket[] = [];

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
  // 1. Return in-memory cached copy if already initialized
  if (globalThis.__UNIFEST_IN_MEMORY_DB__) {
    return globalThis.__UNIFEST_IN_MEMORY_DB__;
  }

  const writablePath = getWritableDbFilePath();

  // 2. Try loading from writable path (e.g. /tmp/unifest_db.json on Vercel or data/db.json locally)
  if (fs.existsSync(writablePath)) {
    try {
      const raw = fs.readFileSync(writablePath, 'utf-8');
      const data: DatabaseSchema = JSON.parse(raw);
      globalThis.__UNIFEST_IN_MEMORY_DB__ = data;
      return data;
    } catch (err) {
      console.warn('Could not read writable db file, checking fallback...', err);
    }
  }

  // 3. Try reading bundled read-only seed from LOCAL_DB_FILE
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
      const data: DatabaseSchema = JSON.parse(raw);
      globalThis.__UNIFEST_IN_MEMORY_DB__ = data;
      safeWriteToDisk(writablePath, JSON.stringify(data, null, 2));
      return data;
    } catch (err) {
      console.warn('Could not read bundled LOCAL_DB_FILE:', err);
    }
  }

  // 4. Fallback to initial seed data
  const seed = getInitialSeedData();
  globalThis.__UNIFEST_IN_MEMORY_DB__ = seed;
  safeWriteToDisk(writablePath, JSON.stringify(seed, null, 2));
  return seed;
}

export function writeDatabase(data: DatabaseSchema): void {
  // Always update in-memory instance immediately so subsequent requests in container see changes
  globalThis.__UNIFEST_IN_MEMORY_DB__ = data;
  const writablePath = getWritableDbFilePath();
  safeWriteToDisk(writablePath, JSON.stringify(data, null, 2));
}

export function resetDatabase(): DatabaseSchema {
  const seed = getInitialSeedData();
  globalThis.__UNIFEST_IN_MEMORY_DB__ = seed;
  const writablePath = getWritableDbFilePath();
  safeWriteToDisk(writablePath, JSON.stringify(seed, null, 2));
  return seed;
}
