import assert from 'assert';
import { runAllocationAlgorithm, overrideStudentAllocation } from '../lib/allocation-engine';
import { resolveRecipients } from '../lib/notification-service';
import { generateQrToken, processScan } from '../lib/qr-service';
import { resetDatabase, readDatabase } from '../lib/db';
import { User } from '@unifest/shared';

async function runTestSuite() {
  console.log('🧪 Starting UniFest Manager Automated Verification Suite...\n');

  // Test Suite 1: Recipient Resolution (BR-9)
  console.log('▶ Test 1: Testing Recipient Resolution (BR-9)...');
  {
    const users: User[] = [
      { id: 'u1', email: 'u1@test.com', name: 'Student 1', gender: 'MALE', role: 'STUDENT', collegeId: 'c1', emailVerified: true },
      { id: 'u2', email: 'u2@test.com', name: 'Student 2', gender: 'FEMALE', role: 'STUDENT', collegeId: 'c2', emailVerified: true },
      { id: 'u3', email: 'u3@test.com', name: 'Student 3', gender: 'MALE', role: 'STUDENT', collegeId: 'c1', emailVerified: true },
      { id: 'm1', email: 'm1@test.com', name: 'Manager 1', gender: 'MALE', role: 'MANAGER', collegeId: null, emailVerified: true },
      { id: 'adm', email: 'adm@test.com', name: 'Admin 1', gender: 'FEMALE', role: 'ADMIN', collegeId: null, emailVerified: true },
    ];

    const registrations = [
      { userId: 'u1', eventId: 'evt-100', status: 'CONFIRMED' },
      { userId: 'u3', eventId: 'evt-200', status: 'CONFIRMED' },
    ];

    // Event 100 updated
    const res1 = resolveRecipients('EVENT_UPDATED', { eventId: 'evt-100' }, users, registrations);
    assert.strictEqual(res1.students.length, 1, 'Only u1 is registered for evt-100');
    assert.strictEqual(res1.students[0].id, 'u1');
    assert.strictEqual(res1.managers.length, 2, 'All managers/admins receive notice');

    // Event 200 updated: u1 must NOT receive notification
    const res2 = resolveRecipients('EVENT_UPDATED', { eventId: 'evt-200' }, users, registrations);
    assert.strictEqual(res2.students.length, 1);
    assert.strictEqual(res2.students[0].id, 'u3');
    assert(!res2.students.some((s) => s.id === 'u1'), 'Student u1 must NOT get notifications for unregistered event');

    console.log('  ✔ BR-9 Verified: Students strictly receive notifications ONLY for registered events.');
  }

  // Test Suite 2: Allocation Engine & Safety Invariants (BR-1 to BR-5)
  console.log('\n▶ Test 2: Testing Allocation Engine Safety Invariants (BR-1 to BR-5)...');
  {
    resetDatabase();
    const result = runAllocationAlgorithm(false, 'TEST_RUNNER');
    const db = readDatabase();

    // Invariant Check 1 (BR-1): A room never holds mixed genders
    for (const room of db.rooms) {
      const roomBeds = db.beds.filter((b) => b.roomId === room.id);
      const roomAllocations = db.allocations.filter((a) => roomBeds.some((b) => b.id === a.bedId));

      for (const alloc of roomAllocations) {
        const student = db.users.find((u) => u.id === alloc.userId);
        assert.strictEqual(
          student?.gender,
          room.gender,
          `BR-1 VIOLATION: Student ${student?.name} (${student?.gender}) in Room ${room.number} (${room.gender})`
        );
      }
    }
    console.log('  ✔ BR-1 Verified: Zero rooms with mixed genders.');

    // Invariant Check 2 (BR-2): A room never holds students from more than one college
    for (const room of db.rooms) {
      const roomBeds = db.beds.filter((b) => b.roomId === room.id);
      const roomAllocations = db.allocations.filter((a) => roomBeds.some((b) => b.id === a.bedId));
      const distinctColleges = new Set(
        roomAllocations.map((a) => db.users.find((u) => u.id === a.userId)?.collegeId)
      );

      assert(
        distinctColleges.size <= 1,
        `BR-2 VIOLATION: Room ${room.number} holds students from ${distinctColleges.size} different colleges!`
      );
    }
    console.log('  ✔ BR-2 Verified: Zero rooms with mixed colleges.');

    // Invariant Check 3 (BR-4): Occupancy never exceeds room capacity
    for (const room of db.rooms) {
      const roomBeds = db.beds.filter((b) => b.roomId === room.id);
      const roomAllocations = db.allocations.filter((a) => roomBeds.some((b) => b.id === a.bedId));
      assert(
        roomAllocations.length <= room.capacity,
        `BR-4 VIOLATION: Room ${room.number} capacity ${room.capacity} exceeded by ${roomAllocations.length} allocations`
      );
    }
    console.log('  ✔ BR-4 Verified: Occupancy strictly <= room capacity on every room.');

    // Invariant Check 4 (BR-5): One bed per user, one user per bed
    const allocatedUserIds = db.allocations.map((a) => a.userId);
    const uniqueUsers = new Set(allocatedUserIds);
    assert.strictEqual(allocatedUserIds.length, uniqueUsers.size, 'BR-5 VIOLATION: User has multiple bed allocations!');

    const allocatedBedIds = db.allocations.map((a) => a.bedId);
    const uniqueBeds = new Set(allocatedBedIds);
    assert.strictEqual(allocatedBedIds.length, uniqueBeds.size, 'BR-5 VIOLATION: Bed allocated to multiple users!');
    console.log('  ✔ BR-5 Verified: Exactly one user per bed and at most one bed per user.');
  }

  // Test Suite 3: Manual Override Constraints (BR-1, BR-2, BR-10)
  console.log('\n▶ Test 3: Testing Manual Overrides & Defense in Depth...');
  {
    resetDatabase();
    const db = readDatabase();

    const maleStudent = db.users.find((u) => u.gender === 'MALE' && u.collegeId === 'col-pce')!;
    const femaleRoom = db.rooms.find((r) => r.gender === 'FEMALE')!;
    const femaleBed = db.beds.find((b) => b.roomId === femaleRoom.id)!;

    // Attempt to move Male into Female room without exception: MUST FAIL
    const invalidGenderMove = overrideStudentAllocation({
      userId: maleStudent.id,
      targetBedId: femaleBed.id,
      actorId: 'usr-manager',
      reason: 'Testing gender violation prevention',
      forceException: false,
    });
    assert.strictEqual(invalidGenderMove.success, false, 'Engine must BLOCK male placement into female room');
    console.log('  ✔ Blocked mixed-gender override attempt.');

    // Attempt to move student into room locked to different college: MUST FAIL
    const lockedRoom = db.rooms.find((r) => r.lockedCollegeId && r.lockedCollegeId !== maleStudent.collegeId)!;
    const lockedRoomBed = db.beds.find((b) => b.roomId === lockedRoom.id)!;
    const invalidCollegeMove = overrideStudentAllocation({
      userId: maleStudent.id,
      targetBedId: lockedRoomBed.id,
      actorId: 'usr-manager',
      reason: 'Testing college violation prevention',
      forceException: false,
    });
    assert.strictEqual(invalidCollegeMove.success, false, 'Engine must BLOCK placement into wrong college room');
    console.log('  ✔ Blocked mixed-college override attempt.');

    // Attempt override without reason: MUST FAIL (BR-10)
    const noReasonMove = overrideStudentAllocation({
      userId: maleStudent.id,
      targetBedId: femaleBed.id,
      actorId: 'usr-manager',
      reason: '',
    });
    assert.strictEqual(noReasonMove.success, false, 'Engine must BLOCK override when reason is omitted');
    console.log('  ✔ Mandatory audit reason enforced.');
  }

  // Test Suite 4: QR Code Verification & Meal Redemption (BR-6, BR-7, BR-8)
  console.log('\n▶ Test 4: Testing QR Token Identity & Multi-Context Scanning...');
  {
    resetDatabase();
    const db = readDatabase();
    const student = db.users.find((u) => u.id === 'usr-aarav')!;

    const { token } = await generateQrToken(student.id);

    // 1. Hostel Check-In
    const checkinRes = await processScan({
      token,
      context: 'HOSTEL_CHECKIN',
      clientScanId: 'test-scan-1',
    });
    // Aarav was already checked in in seed data: duplicate check-in must be denied!
    assert.strictEqual(checkinRes.result, 'DENIED_ALREADY_CHECKED_IN');
    console.log('  ✔ Duplicate hostel check-in denied correctly.');

    // 2. Meal Redemption Idempotency (BR-7)
    // Amit already redeemed lunch in seed data
    const amit = db.users.find((u) => u.id === 'usr-amit')!;
    const { token: amitToken } = await generateQrToken(amit.id);
    const mealRes = await processScan({
      token: amitToken,
      context: 'MEAL',
      slotId: 'slot-lunch-1',
      clientScanId: 'test-scan-2',
    });
    assert.strictEqual(mealRes.result, 'DENIED_DUPLICATE');
    console.log('  ✔ BR-7 Verified: Duplicate meal slot redemption denied strictly.');
  }

  console.log('\n========================================');
  console.log('🎉 ALL BUSINESS RULES AND INVARIANTS PASSED!');
  console.log('========================================\n');
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
