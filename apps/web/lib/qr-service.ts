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
  RoomAllocation,
} from '@unifest/shared';
import { readDatabase, writeDatabase } from './db';

const JWT_SECRET = new TextEncoder().encode(process.env.QR_SECRET || 'unifest_secure_qr_secret_key_2026_super_safe');

export async function generateQrToken(
  userId: string,
  origin?: string
): Promise<{ token: string; qrDataUrl: string; verifyUrl: string }> {
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

  // Encode verification URL so phone camera scanning directly opens the pass verification page!
  const baseUrl = origin || (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) || '';
  const verifyUrl = baseUrl ? `${baseUrl}/verify?token=${token}` : token;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#1E1F5C', // Midnight
      light: '#FFFFFF',
    },
  });

  return { token, qrDataUrl, verifyUrl };
}

// In-memory cache for idempotency of clientScanId (60 seconds)
const idempotentScansCache = new Map<string, { timestamp: number; response: ScanResponse }>();

export async function processScan(
  request: ScanRequest,
  operatorId: string = 'usr-scanner'
): Promise<ScanResponse> {
  const { token, context, slotId, clientScanId, deviceInfo } = request;

  // Extract raw JWT if token was scanned as a URL (e.g. from mobile camera)
  let cleanToken = (token || '').trim();
  if (cleanToken.includes('token=')) {
    try {
      const match = cleanToken.match(/token=([a-zA-Z0-9_\-\.]+)/);
      if (match && match[1]) {
        cleanToken = match[1];
      }
    } catch {}
  }

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
    const { payload } = await jwtVerify(cleanToken, JWT_SECRET);
    const typedPayload = payload as unknown as QrTicketPayload;

    if (typedPayload.fest !== FESTIVAL_ID) {
      scanResult = 'DENIED_INVALID';
      message = 'QR is from a different festival or event.';
    } else {
      verifiedUserId = typedPayload.sub;
      verifiedTokenId = typedPayload.jti;

      let user = db.users.find((u) => u.id === verifiedUserId);
      if (!user) {
        // Query Supabase for the user
        const { supabaseGetUserById } = await import('./supabase');
        const sbUser = await supabaseGetUserById(verifiedUserId);
        if (sbUser) {
          db.users.push(sbUser);
          writeDatabase(db);
          user = sbUser;
        }
      }

      let ticket = db.qrTickets.find((t) => t.userId === verifiedUserId);
      if (!ticket && user) {
        ticket = {
          id: `ticket-${user.id}`,
          userId: user.id,
          tokenId: verifiedTokenId || `jti-${user.id}-${Date.now()}`,
          version: typedPayload.v || 1,
          issuedAt: new Date().toISOString(),
        };
        db.qrTickets.push(ticket);
        writeDatabase(db);
      }

      if (!user) {
        scanResult = 'DENIED_INVALID';
        message = 'User record not found in system.';
      } else if (ticket && ticket.revokedAt) {
        scanResult = 'DENIED_EXPIRED';
        message = 'This QR code has been revoked or renewed. Please present your latest QR.';
      } else {
        const college = db.colleges.find((c) => c.id === user.collegeId);
        userDetails = {
          id: user.id,
          name: user.name,
          gender: user.gender,
          collegeCode: college?.code || 'N/A',
          collegeName: user.collegeName || college?.name || 'Unknown',
          rollNo: (user as any).rollNo || (user as any).roll_no || undefined,
        };

        // 3. Process Contextual logic
        if (context === 'HOSTEL_CHECKIN') {
          let allocation = db.allocations.find((a) => a.userId === user.id);
          let sbClient: any = null;
          try {
            const { getSupabase } = await import('./supabase');
            sbClient = getSupabase();
            if (sbClient && !allocation) {
              const { data: sbAlloc } = await sbClient
                .from('allocations')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
              if (sbAlloc) {
                allocation = {
                  id: sbAlloc.id,
                  userId: sbAlloc.user_id,
                  bedId: sbAlloc.bed_id,
                  allocatedBy: sbAlloc.allocated_by,
                  isOverride: Boolean(sbAlloc.is_override),
                  createdAt: sbAlloc.created_at,
                };
                db.allocations.push(allocation);
              }
            }
          } catch (e) {
            console.warn('QR service: error fetching allocation from Supabase:', e);
          }

          let isNewlyAllocated = false;

          // If student is not assigned a room, auto-allot an eligible vacant bed in a vacant/available room!
          if (!allocation) {
            let liveHostels = db.hostels;
            let liveRooms = db.rooms;
            let liveBeds = db.beds;
            let liveAllocs = db.allocations;
            let liveUsers = db.users;

            if (sbClient) {
              try {
                const [
                  { data: hData },
                  { data: rData },
                  { data: bData },
                  { data: aData },
                  { data: uData },
                ] = await Promise.all([
                  sbClient.from('hostels').select('*'),
                  sbClient.from('rooms').select('*'),
                  sbClient.from('beds').select('*'),
                  sbClient.from('allocations').select('*'),
                  sbClient.from('users').select('*'),
                ]);

                if (hData && hData.length > 0) {
                  liveHostels = hData.map((h: any) => ({
                    id: h.id,
                    name: h.name,
                    gender: h.gender,
                    collegeId: h.college_id,
                    collegeName: h.college_name,
                  }));
                }
                if (rData && rData.length > 0) {
                  liveRooms = rData.map((r: any) => ({
                    id: r.id,
                    hostelId: r.hostel_id,
                    number: r.number,
                    floor: r.floor,
                    capacity: r.capacity || 5,
                    gender: r.gender,
                    lockedCollegeId: r.locked_college_id || null,
                  }));
                }
                if (bData && bData.length > 0) {
                  liveBeds = bData.map((b: any) => ({
                    id: b.id,
                    roomId: b.room_id,
                    label: b.label,
                  }));
                }
                if (aData) {
                  liveAllocs = aData.map((a: any) => ({
                    id: a.id,
                    userId: a.user_id,
                    bedId: a.bed_id,
                    allocatedBy: a.allocated_by,
                    isOverride: Boolean(a.is_override),
                    createdAt: a.created_at,
                  }));
                }
                if (uData && uData.length > 0) {
                  liveUsers = uData.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    gender: u.gender,
                    role: u.role,
                    collegeId: u.college_id,
                    collegeName: u.college_name,
                  }));
                }
              } catch (e) {
                console.warn('QR service: error fetching live inventory from Supabase:', e);
              }
            }

            // Resolve student's collegeId if missing
            let studentCollegeId = user.collegeId;
            if (!studentCollegeId && user.collegeName) {
              const matchedCol = db.colleges.find((c) => c.name.toLowerCase() === user.collegeName!.toLowerCase());
              if (matchedCol) studentCollegeId = matchedCol.id;
            }

            // Find matching hostels by student gender (Boys -> Chanakya Hall, Girls -> Rosewood Hall)
            const matchingHostels = liveHostels.filter((h) => h.gender === user.gender);
            const matchingHostelIds = new Set(matchingHostels.map((h) => h.id));
            const candidateRooms = liveRooms.filter(
              (r) => matchingHostelIds.has(r.hostelId) && (r.gender === user.gender || !r.gender)
            );

            // Map each room's current occupants and free beds
            const occupiedBedIds = new Set(liveAllocs.map((a) => a.bedId));

            interface RoomCandidate {
              room: typeof liveRooms[0];
              hostel: typeof liveHostels[0];
              freeBeds: typeof liveBeds;
              isSameCollegeRoom: boolean;
              isEmpty: boolean;
            }

            const roomCandidates: RoomCandidate[] = [];

            for (const r of candidateRooms) {
              const hostel = matchingHostels.find((h) => h.id === r.hostelId)!;
              const rBeds = liveBeds.filter((b) => b.roomId === r.id);
              const freeBeds = rBeds.filter((b) => !occupiedBedIds.has(b.id));

              if (freeBeds.length === 0) continue; // room is full

              // Find current occupants of this room
              const roomAllocs = liveAllocs.filter((a) => rBeds.some((b) => b.id === a.bedId));
              const occupantCollegeIds = new Set<string>();
              for (const a of roomAllocs) {
                const occUser = liveUsers.find((u) => u.id === a.userId);
                if (occUser?.collegeId) occupantCollegeIds.add(occUser.collegeId);
              }

              // Enforce Same College Rule: NO mixing of different colleges!
              let isLockedToOtherCollege = false;
              let isSameCollegeRoom = false;
              const isEmpty = roomAllocs.length === 0;

              if (r.lockedCollegeId && studentCollegeId && r.lockedCollegeId !== studentCollegeId) {
                isLockedToOtherCollege = true;
              }

              for (const occColId of occupantCollegeIds) {
                if (studentCollegeId && occColId !== studentCollegeId) {
                  isLockedToOtherCollege = true;
                }
              }

              if (!isLockedToOtherCollege && !isEmpty) {
                isSameCollegeRoom = true;
              }

              if (!isLockedToOtherCollege) {
                roomCandidates.push({
                  room: r,
                  hostel,
                  freeBeds,
                  isSameCollegeRoom,
                  isEmpty,
                });
              }
            }

            // Priority 1: Fill up a room already containing students from the SAME college
            // Priority 2: Use an entirely empty room and lock it to this student's college
            let chosen = roomCandidates.find((rc) => rc.isSameCollegeRoom && rc.freeBeds.length > 0);
            if (!chosen) {
              chosen = roomCandidates.find((rc) => rc.isEmpty && rc.freeBeds.length > 0);
            }

            if (chosen) {
              const targetRoom = chosen.room;
              const targetBed = chosen.freeBeds[0];
              const targetHostel = chosen.hostel;

              const allocId = `alloc-${user.id}-${Date.now().toString(36)}`;
              const newAlloc: RoomAllocation = {
                id: allocId,
                userId: user.id,
                bedId: targetBed.id,
                allocatedBy: operatorId || 'QR_SCAN_AUTO',
                isOverride: false,
                reason: 'Auto-allotted on QR Check-in (Same College Rule Enforced)',
                createdAt: new Date().toISOString(),
              };

              // Persist to Supabase if available
              if (sbClient) {
                try {
                  await sbClient.from('allocations').insert({
                    id: newAlloc.id,
                    user_id: newAlloc.userId,
                    bed_id: newAlloc.bedId,
                    allocated_by: newAlloc.allocatedBy,
                    is_override: false,
                    reason: newAlloc.reason,
                    created_at: newAlloc.createdAt,
                  });
                  if (studentCollegeId) {
                    await sbClient.from('rooms').update({ locked_college_id: studentCollegeId }).eq('id', targetRoom.id);
                  }
                } catch (e) {
                  console.warn('QR service: error inserting allocation into Supabase:', e);
                }
              }

              // Persist to local DB
              db.allocations.push(newAlloc);
              const localRoom = db.rooms.find((r) => r.id === targetRoom.id);
              if (localRoom && studentCollegeId) {
                localRoom.lockedCollegeId = studentCollegeId;
              }

              db.auditLogs.unshift({
                id: `audit-${Date.now()}`,
                actorId: operatorId || 'SCANNER',
                actorName: operator?.name || 'Gate Scanner Staff',
                action: 'AUTO_ALLOCATION_RUN',
                entity: 'HOSTEL_ALLOCATION',
                entityId: newAlloc.id,
                reason: `Auto-allotted Room ${targetRoom.number} (${targetHostel.name}, ${targetBed.label}) to ${user.name} on check-in.`,
                before: null,
                after: { userId: user.id, bedId: targetBed.id, roomId: targetRoom.id, hostelId: targetHostel.id },
                at: new Date().toISOString(),
              });
              writeDatabase(db);

              allocation = newAlloc;
              isNewlyAllocated = true;
            }
          }

          if (!allocation) {
            scanResult = 'DENIED_NO_ALLOCATION';
            message = `No vacant rooms available in ${user.gender === 'MALE' ? 'Boys' : 'Girls'} Hostels matching college guidelines. Please visit Help Desk.`;
          } else {
            // Find student's allocated bed, room & hostel
            let bed = db.beds.find((b) => b.id === allocation.bedId);
            let room = db.rooms.find((r) => r.id === bed?.roomId);
            let hostel = db.hostels.find((h) => h.id === room?.hostelId);

            if ((!bed || !room || !hostel) && sbClient) {
              try {
                if (!bed) {
                  const { data: bData } = await sbClient.from('beds').select('*').eq('id', allocation.bedId).maybeSingle();
                  if (bData) bed = { id: bData.id, roomId: bData.room_id, label: bData.label };
                }
                if (bed && !room) {
                  const { data: rData } = await sbClient.from('rooms').select('*').eq('id', bed.roomId).maybeSingle();
                  if (rData) room = { id: rData.id, hostelId: rData.hostel_id, number: rData.number, floor: rData.floor, capacity: rData.capacity, gender: rData.gender, lockedCollegeId: rData.locked_college_id };
                }
                if (room && !hostel) {
                  const { data: hData } = await sbClient.from('hostels').select('*').eq('id', room.hostelId).maybeSingle();
                  if (hData) hostel = { id: hData.id, name: hData.name, gender: hData.gender, collegeId: hData.college_id, collegeName: hData.college_name };
                }
              } catch {}
            }

            // Find student's last check-in log
            const userCheckins = db.checkinLogs
              .filter((l) => l.userId === user.id)
              .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
            const lastLog = userCheckins[0];

            allowed = true;
            scanResult = 'ALLOWED';

            const checkinRecord: CheckinLog = {
              id: `chk-${Date.now()}`,
              userId: user.id,
              type: 'CHECK_IN',
              scannedBy: operatorId,
              at: new Date().toISOString(),
            };

            if (lastLog && lastLog.type === 'CHECK_IN' && !isNewlyAllocated) {
              message = `ALREADY CHECKED IN: ${hostel?.name || 'Hostel'} - Room ${room?.number || '101'}, ${bed?.label || 'Bed A'}`;
            } else {
              db.checkinLogs.unshift(checkinRecord);
              if (sbClient) {
                try {
                  await sbClient.from('checkin_logs').insert({
                    id: checkinRecord.id,
                    user_id: checkinRecord.userId,
                    type: 'CHECK_IN',
                    scanned_by: checkinRecord.scannedBy,
                  });
                } catch (e) {
                  console.warn('QR service: error inserting checkin log into Supabase:', e);
                }
              }
              writeDatabase(db);

              if (isNewlyAllocated) {
                message = `✨ ROOM ALLOTTED & CHECKED IN: ${hostel?.name || 'Hostel'} - Room ${room?.number || '101'}, ${bed?.label || 'Bed A'}`;
              } else {
                message = `CHECK-IN CONFIRMED: ${hostel?.name || 'Hostel'} - Room ${room?.number || '101'}, ${bed?.label || 'Bed A'}`;
              }
            }

            details = {
              hostelName: hostel?.name,
              roomNumber: room?.number,
              bedLabel: bed?.label,
              floor: room?.floor,
              collegeName: user.collegeName || userDetails?.collegeName,
              isNewlyAllocated,
              timestamp: checkinRecord.at,
            };
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

            // Sync checkout to Supabase if available
            let sbClient: any = null;
            try {
              const { getSupabase } = await import('./supabase');
              sbClient = getSupabase();
              if (sbClient) {
                await sbClient.from('checkin_logs').insert({
                  id: checkoutRecord.id,
                  user_id: checkoutRecord.userId,
                  type: 'CHECK_OUT',
                  scanned_by: checkoutRecord.scannedBy,
                });
              }
            } catch (e) {
              console.warn('QR service: error inserting checkout log into Supabase:', e);
            }
            writeDatabase(db);

            // Fetch student's room allocation for display
            let userAlloc = db.allocations.find((a) => a.userId === user.id);
            let bed = userAlloc ? db.beds.find((b) => b.id === userAlloc.bedId) : null;
            let room = bed ? db.rooms.find((r) => r.id === bed.roomId) : null;
            let hostel = room ? db.hostels.find((h) => h.id === room.hostelId) : null;

            if (room && hostel) {
              message = `CHECK-OUT CONFIRMED: Room ${room.number} (${hostel.name}) vacated. Safe travels!`;
            } else {
              message = 'CHECK-OUT CONFIRMED. Safe travels!';
            }

            details = {
              hostelName: hostel?.name,
              roomNumber: room?.number,
              bedLabel: bed?.label,
              floor: room?.floor,
              collegeName: user.collegeName || userDetails?.collegeName,
              timestamp: checkoutRecord.at,
            };
          }
        } else if (context === 'MEAL') {
          // Resolve meal slot
          let targetSlotId = slotId;
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];

          if (!targetSlotId) {
            // Pick active slot or default today's slot
            const defaultSlot = db.mealSlots.find((s) => s.date === todayStr);
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
                // Accredited student without a restricted college batch is welcomed!
                allowed = true;
                scanResult = 'ALLOWED';
                const mealRecord: MealLog = {
                  id: `mlog-${Date.now()}`,
                  userId: user.id,
                  slotId: targetSlotId,
                  batchId: 'batch-open',
                  scannedBy: operatorId,
                  isException: false,
                  at: new Date().toISOString(),
                };
                db.mealLogs.unshift(mealRecord);
                message = `MEAL ALLOWED: ${slot?.type || 'Meal'} served for ${user.name}.`;
                details = {
                  mealBatchWindow: 'All Batches Open',
                  timestamp: mealRecord.at,
                };
              } else {
                const start = new Date(batch.startsAt).getTime();
                const end = new Date(batch.endsAt).getTime();
                const nowTime = now.getTime();
                const gracePeriodMs = 30 * 60 * 1000; // 30 mins grace period

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
  } catch (err: any) {
    scanResult = 'DENIED_INVALID';
    message = 'Tampered, expired, or invalid QR signature.';
  }

  // 4. Create immutable audit log
  const college = db.colleges.find((c) => c.id === userDetails?.id);
  const scanRecord: ScanLog = {
    id: `scan-${Date.now()}`,
    ticketId: verifiedTokenId || undefined,
    userId: verifiedUserId || undefined,
    userName: userDetails?.name,
    collegeCode: userDetails?.collegeCode,
    context,
    result: scanResult,
    scannedBy: operatorId,
    deviceInfo: deviceInfo || 'Web Scanner PWA',
    at: new Date().toISOString(),
  };

  db.scanLogs.unshift(scanRecord);
  writeDatabase(db);

  const response: ScanResponse = {
    result: scanResult,
    allowed,
    message,
    clientScanId,
    user: userDetails,
    details,
  };

  idempotentScansCache.set(clientScanId, { timestamp: Date.now(), response });
  return response;
}
