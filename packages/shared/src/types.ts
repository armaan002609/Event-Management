export type Role = 'STUDENT' | 'MANAGER' | 'SCANNER' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE';
export type EventType = 'SPORTS' | 'FOLK';
export type EventStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';
export type ScanContext = 'HOSTEL_CHECKIN' | 'HOSTEL_CHECKOUT' | 'MEAL';

export type ScanResult =
  | 'ALLOWED'
  | 'DENIED_DUPLICATE'
  | 'DENIED_WRONG_BATCH'
  | 'DENIED_NOT_ELIGIBLE'
  | 'DENIED_INVALID'
  | 'DENIED_EXPIRED'
  | 'DENIED_NO_ALLOCATION'
  | 'DENIED_NOT_CHECKED_IN'
  | 'DENIED_ALREADY_CHECKED_IN'
  | 'DENIED_OUTSIDE_WINDOW';

export type CheckinType = 'CHECK_IN' | 'CHECK_OUT';

export interface College {
  id: string;
  name: string;
  code: string;
  color?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  fatherName?: string | null;
  fatherPhone?: string | null;
  address?: string | null;
  collegeId?: string | null;
  collegeName?: string | null;
  college?: College | null;
  rollNo?: string | null;
  course?: string | null;
  passingYear?: number | string | null;
  avatarUrl?: string | null;
  isProfileComplete?: boolean;
  gender: Gender;
  role: Role;
  emailVerified: boolean;
  password?: string;
  verificationCode?: string;
}

export function isUserProfileComplete(user: User | null | undefined): boolean {
  if (!user) return false;
  // Non-students don't need student academic profile
  if (user.role !== 'STUDENT') return true;
  return Boolean(
    user.name?.trim() &&
    user.phone?.trim() &&
    user.fatherName?.trim() &&
    user.fatherPhone?.trim() &&
    user.address?.trim() &&
    (user.collegeId || user.collegeName?.trim()) &&
    user.rollNo?.trim() &&
    user.course?.trim() &&
    user.passingYear &&
    user.avatarUrl?.trim()
  );
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  description?: string | null;
  venue: string;
  startsAt: string; // ISO string
  endsAt: string;   // ISO string
  capacity?: number | null;
  status: EventStatus;
  registrationsCount?: number;
  isRegistered?: boolean;
}

export interface EventRegistration {
  id: string;
  userId: string;
  eventId: string;
  status: string;
  createdAt?: string;
  event?: Event;
  user?: User;
}

export interface Hostel {
  id: string;
  name: string;
  gender: Gender;
  rooms?: Room[];
}

export interface Room {
  id: string;
  hostelId: string;
  number: string;
  floor: number;
  capacity: number;
  gender: Gender;
  lockedCollegeId?: string | null;
  lockedCollege?: College | null;
  beds?: Bed[];
}

export interface Bed {
  id: string;
  roomId: string;
  label: string;
  allocation?: RoomAllocation | null;
}

export interface RoomAllocation {
  id: string;
  userId: string;
  bedId: string;
  allocatedBy: string;
  isOverride: boolean;
  reason?: string | null;
  createdAt: string;
  user?: User;
  bed?: Bed & { room?: Room & { hostel?: Hostel } };
}

export interface QrTicket {
  id: string;
  userId: string;
  tokenId: string;
  version: number;
  issuedAt: string;
  revokedAt?: string | null;
}

export interface QrTicketPayload {
  sub: string;     // userId
  jti: string;     // tokenId
  v: number;       // version
  iat: number;     // timestamp
  fest: string;    // festival identifier
}

export interface ScanRequest {
  token: string;
  context: ScanContext;
  slotId?: string;
  clientScanId: string;
  deviceInfo?: string;
}

export interface ScanResponse {
  result: ScanResult;
  allowed: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    gender: Gender;
    collegeCode: string;
    collegeName: string;
  };
  details?: {
    hostelName?: string;
    roomNumber?: string;
    bedLabel?: string;
    mealBatchWindow?: string;
    timestamp: string;
    isException?: boolean;
  };
  clientScanId: string;
}

export interface MealSlot {
  id: string;
  date: string; // YYYY-MM-DD
  type: MealType;
  batches?: MealBatch[];
}

export interface MealBatch {
  id: string;
  slotId: string;
  collegeId: string;
  college?: College;
  gender: Gender;
  startsAt: string; // ISO
  endsAt: string;   // ISO
}

export interface MealLog {
  id: string;
  userId: string;
  slotId: string;
  batchId: string;
  scannedBy: string;
  isException: boolean;
  at: string;
}

export interface CheckinLog {
  id: string;
  userId: string;
  type: CheckinType;
  scannedBy: string;
  at: string;
}

export interface ScanLog {
  id: string;
  ticketId?: string | null;
  userId?: string | null;
  context: ScanContext;
  result: ScanResult;
  reason?: string | null;
  scannedBy: string;
  deviceInfo?: string | null;
  at: string;
  userName?: string;
  collegeCode?: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  type: string;
  subject: string;
  body: string;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'BOUNCED';
  eventId?: string | null;
  attempts: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  entity: string;
  entityId: string;
  reason?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  at: string;
}

export interface AllocationShortfall {
  collegeId: string;
  collegeCode: string;
  collegeName: string;
  gender: Gender;
  requested: number;
  allocated: number;
  shortfall: number;
}

export interface AllocationRunResult {
  dryRun: boolean;
  totalUnallocatedInitial: number;
  allocatedCount: number;
  unallocatedCount: number;
  shortfalls: AllocationShortfall[];
  allocations: Array<{
    userId: string;
    userName: string;
    collegeCode: string;
    gender: Gender;
    hostelName: string;
    roomNumber: string;
    bedLabel: string;
  }>;
}

export interface AllocationMatrixRoom {
  id: string;
  number: string;
  floor: number;
  capacity: number;
  gender: Gender;
  lockedCollegeId: string | null;
  lockedCollegeCode: string | null;
  lockedCollegeName: string | null;
  lockedCollegeColor: string | null;
  isLocked: boolean;
  beds: Array<{
    id: string;
    label: string;
    allocation: {
      id: string;
      userId: string;
      userName: string;
      collegeId: string;
      collegeCode: string;
      collegeColor: string;
      gender: Gender;
      checkedIn: boolean;
    } | null;
  }>;
}

export interface AllocationMatrixFloor {
  floor: number;
  rooms: AllocationMatrixRoom[];
}

export interface AllocationMatrixHostel {
  id: string;
  name: string;
  gender: Gender;
  floors: AllocationMatrixFloor[];
}
