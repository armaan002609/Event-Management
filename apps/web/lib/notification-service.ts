import { NotificationLog, User } from '@unifest/shared';
import { readDatabase, writeDatabase } from './db';

export type DomainEventType =
  | 'EVENT_UPDATED'
  | 'EVENT_CANCELLED'
  | 'EVENT_REGISTRATION'
  | 'ROOM_ALLOCATED'
  | 'CAPACITY_SHORTFALL'
  | 'BROADCAST';

export interface DomainEventPayload {
  eventId?: string;
  userId?: string;
  collegeId?: string;
  gender?: 'MALE' | 'FEMALE';
  title?: string;
  subject?: string;
  message?: string;
  changes?: string[];
  shortfallsSummary?: string;
}

/**
 * Pure recipient resolver function (Core Business Rule BR-9).
 * Students receive notifications ONLY for events they are registered for (plus their own account/room notices).
 * Managers receive all global alerts.
 */
export function resolveRecipients(
  eventType: DomainEventType,
  payload: DomainEventPayload,
  allUsers: User[],
  registrations: Array<{ userId: string; eventId: string; status: string }>
): { students: User[]; managers: User[] } {
  const managers = allUsers.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');
  let students: User[] = [];

  switch (eventType) {
    case 'EVENT_UPDATED':
    case 'EVENT_CANCELLED': {
      if (payload.eventId) {
        // ONLY students registered for this specific event
        const registeredUserIds = new Set(
          registrations.filter((r) => r.eventId === payload.eventId && r.status === 'CONFIRMED').map((r) => r.userId)
        );
        students = allUsers.filter((u) => u.role === 'STUDENT' && registeredUserIds.has(u.id));
      }
      break;
    }

    case 'EVENT_REGISTRATION':
    case 'ROOM_ALLOCATED': {
      if (payload.userId) {
        // Individual student only
        students = allUsers.filter((u) => u.id === payload.userId);
      }
      break;
    }

    case 'CAPACITY_SHORTFALL': {
      // Shortfalls go to managers only
      students = [];
      break;
    }

    case 'BROADCAST': {
      // Filter students by college, gender, or event if specified
      students = allUsers.filter((u) => {
        if (u.role !== 'STUDENT') return false;
        if (payload.collegeId && u.collegeId !== payload.collegeId) return false;
        if (payload.gender && u.gender !== payload.gender) return false;
        if (payload.eventId) {
          const isReg = registrations.some(
            (r) => r.userId === u.id && r.eventId === payload.eventId && r.status === 'CONFIRMED'
          );
          if (!isReg) return false;
        }
        return true;
      });
      break;
    }
  }

  return { students, managers };
}

export function emitDomainNotification(
  eventType: DomainEventType,
  payload: DomainEventPayload,
  actorName: string = 'System'
): { studentsNotified: number; managersNotified: number } {
  const db = readDatabase();

  const { students, managers } = resolveRecipients(
    eventType,
    payload,
    db.users,
    db.registrations
  );

  const now = new Date().toISOString();
  const logsToInsert: NotificationLog[] = [];

  // 1. Notify relevant students
  for (const student of students) {
    let subject = payload.subject || 'UniFest Festival Update';
    let body = payload.message || '';

    if (eventType === 'EVENT_UPDATED') {
      subject = `[Schedule Update] ${payload.title || 'Event Details Changed'}`;
      body = `Hello ${student.name},\n\nAn event you are registered for has been updated by the festival committee:\n${payload.changes?.join('\n') || payload.message}\n\nPlease check your My Schedule tab for the latest timings.`;
    } else if (eventType === 'EVENT_CANCELLED') {
      subject = `[Urgent Cancellation] ${payload.title || 'Event Cancelled'}`;
      body = `Hello ${student.name},\n\nWe regret to inform you that ${payload.title} has been cancelled: ${payload.message}`;
    }

    logsToInsert.push({
      id: `notif-${Date.now()}-${student.id}`,
      userId: student.id,
      userEmail: student.email,
      userName: student.name,
      type: eventType,
      subject,
      body,
      status: 'SENT',
      eventId: payload.eventId,
      attempts: 1,
      createdAt: now,
    });
  }

  // 2. Notify managers for global and critical events
  if (['EVENT_UPDATED', 'EVENT_CANCELLED', 'CAPACITY_SHORTFALL', 'BROADCAST'].includes(eventType)) {
    for (const manager of managers) {
      logsToInsert.push({
        id: `notif-mgr-${Date.now()}-${manager.id}`,
        userId: manager.id,
        userEmail: manager.email,
        userName: manager.name,
        type: eventType,
        subject: `[Manager Alert] ${payload.subject || payload.title || eventType}`,
        body: `Alert triggered by ${actorName}:\n${payload.message || payload.shortfallsSummary || 'Status update.'}`,
        status: 'SENT',
        eventId: payload.eventId,
        attempts: 1,
        createdAt: now,
      });
    }
  }

  db.notificationLogs.unshift(...logsToInsert);
  writeDatabase(db);

  return {
    studentsNotified: students.length,
    managersNotified: managers.length,
  };
}
