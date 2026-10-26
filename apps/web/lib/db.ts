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
    { id: 'col-cgc-univ-mohali', name: 'CGC University, Mohali', code: 'CGC-M', color: '#4F46E5' },
    { id: 'col-1793043228502-fv6t', name: 'Panjab University', code: 'PANJ', color: '#4F46E5' },
    { id: 'col-1793043228502-z1yi', name: 'Thapar Institute of Engineering and Technology', code: 'THAP', color: '#059669' },
    { id: 'col-1793043228502-m6vd', name: 'Lovely Professional University', code: 'LOVE', color: '#E11D48' },
    { id: 'col-1793043228502-3m9h', name: 'Delhi University (Hansraj College)', code: 'DELH', color: '#0D9488' },
  ];

  const hostels: Hostel[] = [
    { id: 'hostel-1793036398955', name: 'Chanakya Hall', gender: 'MALE', collegeId: 'col-cgc-univ-mohali', collegeName: 'CGC University, Mohali' },
    { id: 'hostel-1793037722443', name: 'Rosewood Hall', gender: 'FEMALE', collegeId: 'col-cgc-univ-mohali', collegeName: 'CGC University, Mohali' },
  ];

  const rooms: Room[] = [];
  const beds: Bed[] = [];

  const roomNumbers = [
    { floor: 1, numbers: ['101', '102', '103', '104', '105', '106'] },
    { floor: 2, numbers: ['201', '202', '203', '204', '205', '206'] },
  ];

  hostels.forEach((h) => {
    roomNumbers.forEach(({ floor, numbers }) => {
      numbers.forEach((num) => {
        const roomId = `room-${h.id}-${num}`;
        rooms.push({
          id: roomId,
          hostelId: h.id,
          number: num,
          floor,
          capacity: 5,
          gender: h.gender,
          lockedCollegeId: null,
        });
        ['A', 'B', 'C', 'D', 'E'].forEach((letter) => {
          beds.push({
            id: `bed-${roomId}-${letter}`,
            roomId,
            label: `Bed ${letter}`,
          });
        });
      });
    });
  });

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
  const events: Event[] = [];
  const registrations: EventRegistration[] = [];
  const mealSlots: MealSlot[] = [];
  const mealBatches: MealBatch[] = [];
  const mealLogs: MealLog[] = [];
  const scanLogs: ScanLog[] = [];
  const notificationLogs: NotificationLog[] = [];
  const auditLogs: AuditLog[] = [];

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
  const writablePath = getWritableDbFilePath();

  // 1. Try loading from writable path (e.g. data/db.json locally or /tmp on Vercel)
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

  // 2. Return in-memory cached copy if already initialized
  if (globalThis.__UNIFEST_IN_MEMORY_DB__) {
    return globalThis.__UNIFEST_IN_MEMORY_DB__;
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
