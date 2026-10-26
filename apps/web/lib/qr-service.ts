import { SignJWT, jwtVerify } from 'jose';
import QRCode from 'qrcode';
import {
  FESTIVAL_ID,
  ScanContext,
  ScanRequest,
  ScanResponse,
  ScanResult,
  ScanLog,
  CheckinLog,
  MealLog,
  QrTicketPayload,
} from '@unifest/shared';
import { readDatabase, writeDatabase } from './db';

const JWT_SECRET = new TextEncoder().encode(process.env.QR_SECRET || 'unifest_secure_qr_secret_key_2026_super_safe');

export async function generateQrToken(userId: string): Promise<{ token: string; qrDataUrl: string }> {
  const db = readDatabase();
  let ticket = db.qrTickets.find((t) => t.userId === userId);

  if (!ticket) {
    ticket = {
      id: `ticket-${userId}`,
      userId,
      tokenId: `jti-${userId}-${Date.now()}`,
      version: 1,
      issuedAt: new Date().toISOString(),
    };
    db.qrTickets.push(ticket);
    writeDatabase(db);
  }

  // Token holds IDENTITY ONLY (sub, jti, v, fest) - NO PII, NO ROOM, NO MEAL INFO!
  const payload: QrTicketPayload = {
    sub: userId,
    jti: ticket.tokenId,
    v: ticket.version,
    iat: Math.floor(Date.now() / 1000),
    fest: FESTIVAL_ID,
  };

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const qrDataUrl = await QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#1E1F5C', // Midnight
      light: '#FFFFFF',
    },
  });

  return { token, qrDataUrl };
}

// In-memory cache for idempotency of clientScanId (60 seconds)
const idempotentScansCache = new Map<string, { timestamp: number; response: ScanResponse }>();

export async function processScan(
  request: ScanRequest,
  operatorId: string = 'usr-scanner'
): Promise<ScanResponse> {
  const { token, context, slotId, clientScanId, deviceInfo } = request;

  // 1. Check idempotency cache
  const cached = idempotentScansCache.get(clientScanId);
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.response;
  }

  const db = readDatabase();
  const operator = db.users.find((u) => u.id === operatorId);

  let verifiedUserId: string | null = null;
  let verifiedTokenId: string | null = null;
  let scanResult: ScanResult = 'DENIED_INVALID';
  let message = 'Invalid QR code.';
  let allowed = false;
  let userDetails: ScanResponse['user'];
  let details: ScanResponse['details'];

  try {
    // 2. Verify token cryptographically
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const typedPayload = payload as unknown as QrTicketPayload;

    if (typedPayload.fest !== FESTIVAL_ID) {
      scanResult = 'DENIED_INVALID';
      message = 'QR is from a different festival or event.';
    } else {
      verifiedUserId = typedPayload.sub;
      verifiedTokenId = typedPayload.jti;

      const user = db.users.find((u) => u.id === verifiedUserId);
      const ticket = db.qrTickets.find((t) => t.userId === verifiedUserId);

      if (!user || !ticket) {
        scanResult = 'DENIED_INVALID';
        message = 'User or ticket record not found in system.';
      } else if (ticket.revokedAt || typedPayload.v !== ticket.version) {
        scanResult = 'DENIED_EXPIRED';
        message = 'This QR code has been revoked or renewed. Please present your latest QR.';
      } else {
        const college = db.colleges.find((c) => c.id === user.collegeId);
        userDetails = {
          id: user.id,
          name: user.name,
          gender: user.gender,
          collegeCode: college?.code || 'N/A',
          collegeName: college?.name || 'Unknown',
        };

        // 3. Process Contextual logic
        if (context === 'HOSTEL_CHECKIN') {
          const allocation = db.allocations.find((a) => a.userId === user.id);
          if (!allocation) {
            scanResult = 'DENIED_NO_ALLOCATION';
            message = 'No hostel room allocated for this student. Visit Help Desk.';
          } else {
            // Find student's last check-in log
            const userCheckins = db.checkinLogs
              .filter((l) => l.userId === user.id)
              .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
            const lastLog = userCheckins[0];

            if (lastLog && lastLog.type === 'CHECK_IN') {
              scanResult = 'DENIED_ALREADY_CHECKED_IN';
              message = `Already checked in on ${new Date(lastLog.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
            } else {
              // ALLOW CHECK-IN
              allowed = true;
              scanResult = 'ALLOWED';
              const bed = db.beds.find((b) => b.id === allocation.bedId);
              const room = db.rooms.find((r) => r.id === bed?.roomId);
              const hostel = db.hostels.find((h) => h.id === room?.hostelId);

              const checkinRecord: CheckinLog = {
                id: `chk-${Date.now()}`,
                userId: user.id,
                type: 'CHECK_IN',
                scannedBy: operatorId,
                at: new Date().toISOString(),
              };
              db.checkinLogs.unshift(checkinRecord);

              message = `CHECK-IN CONFIRMED: ${hostel?.name || 'Hostel'} - Room ${room?.number}, ${bed?.label}`;
              details = {
                hostelName: hostel?.name,
                roomNumber: room?.number,
                bedLabel: bed?.label,
                timestamp: checkinRecord.at,
              };
            }
          }
        } else if (context === 'HOSTEL_CHECKOUT') {
          const userCheckins = db.checkinLogs
            .filter((l) => l.userId === user.id)
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
          const lastLog = userCheckins[0];

          if (!lastLog || lastLog.type !== 'CHECK_IN') {
            scanResult = 'DENIED_NOT_CHECKED_IN';
            message = 'Student is not currently marked as checked in.';
          } else {
            // ALLOW CHECKOUT
            allowed = true;
            scanResult = 'ALLOWED';
            const checkoutRecord: CheckinLog = {
              id: `chk-${Date.now()}`,
              userId: user.id,
              type: 'CHECK_OUT',
              scannedBy: operatorId,
              at: new Date().toISOString(),
            };
            db.checkinLogs.unshift(checkoutRecord);
            message = 'CHECK-OUT CONFIRMED. Safe travels!';
            details = {
              timestamp: checkoutRecord.at,
            };
          }
        } else if (context === 'MEAL') {
          // Resolve meal slot
          let targetSlotId = slotId;
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];

          if (!targetSlotId) {
            // Pick active slot or default today's lunch
            const defaultSlot = db.mealSlots.find((s) => s.date === todayStr && s.type === 'LUNCH');
            targetSlotId = defaultSlot?.id || db.mealSlots[0]?.id;
          }

          if (!targetSlotId) {
            scanResult = 'DENIED_OUTSIDE_WINDOW';
            message = 'No meal slot active at this time.';
          } else {
            const slot = db.mealSlots.find((s) => s.id === targetSlotId);
            // Check if user already redeemed for this slot
            const alreadyRedeemed = db.mealLogs.find(
              (m) => m.userId === user.id && m.slotId === targetSlotId
            );

            if (alreadyRedeemed) {
              scanResult = 'DENIED_DUPLICATE';
              message = `Already redeemed ${slot?.type || 'meal'} at ${new Date(alreadyRedeemed.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
            } else {
              // Find matching batch for (collegeId, gender)
              const batch = db.mealBatches.find(
                (b) =>
                  b.slotId === targetSlotId &&
                  b.collegeId === user.collegeId &&
                  b.gender === user.gender
              );

              if (!batch) {
                // If no specific batch, check if there is an open meal window
                scanResult = 'DENIED_NOT_ELIGIBLE';
                message = `No meal batch registered for ${college?.code || 'your college'} (${user.gender}).`;
              } else {
                const start = new Date(batch.startsAt).getTime();
                const end = new Date(batch.endsAt).getTime();
                const nowTime = now.getTime();
                const gracePeriodMs = 15 * 60 * 1000; // 15 mins grace period

                const isInsideWindow = nowTime >= start - gracePeriodMs && nowTime <= end + gracePeriodMs;

                if (!isInsideWindow) {
                  scanResult = 'DENIED_WRONG_BATCH';
                  const startStr = new Date(batch.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const endStr = new Date(batch.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  message = `Wrong batch time! Your slot is ${startStr} - ${endStr}.`;
                } else {
                  // ALLOW MEAL
                  allowed = true;
                  scanResult = 'ALLOWED';
                  const mealRecord: MealLog = {
                    id: `mlog-${Date.now()}`,
                    userId: user.id,
                    slotId: targetSlotId,
                    batchId: batch.id,
                    scannedBy: operatorId,
                    isException: false,
                    at: new Date().toISOString(),
                  };
                  db.mealLogs.unshift(mealRecord);
                  message = `MEAL ALLOWED: ${slot?.type || 'Meal'} served for ${user.name}.`;
                  details = {
                    mealBatchWindow: `${new Date(batch.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(batch.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                    timestamp: mealRecord.at,
                  };
                }
              }
            }
          }
        }
      }
    }
  } catch (err: unknown) {
    scanResult = 'DENIED_INVALID';
    message = (err as Error)?.message || 'Invalid or malformed QR token.';
  }

  // 4. Log EVERY scan attempt in ScanLog (BR-6)
  const scanLogEntry: ScanLog = {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ticketId: verifiedTokenId,
    userId: verifiedUserId,
    context,
    result: scanResult,
    reason: allowed ? null : message,
    scannedBy: operator?.name || operatorId,
    deviceInfo: deviceInfo || 'Web Scanner PWA',
    at: new Date().toISOString(),
    userName: userDetails?.name,
    collegeCode: userDetails?.collegeCode,
  };

  db.scanLogs.unshift(scanLogEntry);
  writeDatabase(db);

  const response: ScanResponse = {
    result: scanResult,
    allowed,
    message,
    user: userDetails,
    details,
    clientScanId,
  };

  // Cache for idempotency
  idempotentScansCache.set(clientScanId, {
    timestamp: Date.now(),
    response,
  });

  return response;
}
