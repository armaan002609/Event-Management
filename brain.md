# brain.md: UniFest Manager (Project Context for AI Coding Assistants)

> Read this file before generating or modifying any code. If a request conflicts with a rule in **Section 3**, refuse the conflicting part and explain why.

## 1. What This App Is
A web platform for inter-college/university **sports and folk events** that also handles **hostel accommodation** and **meals**.
- **Roles:** `STUDENT`, `MANAGER`, `SCANNER`, `ADMIN`.
- **Modules:** Events, Notifications, Hostel Allocation + QR check-in/out, Meals (QR + batches).
- **One QR per user** (identity only). The scanner's selected mode decides what the scan means.

## 2. Core Philosophy
1. **Safety rules are hard constraints**, never preferences or warnings.
2. **Defense in depth:** validate in the service layer AND enforce in the database (constraints/triggers).
3. **Idempotent everything:** scans, allocation runs and emails must be safe to retry.
4. **Relevance over volume:** students only get notifications for what concerns them.
5. **Auditability:** every override or exception writes an `AuditLog` with a reason.
6. **Fast scans:** server verification p95 < 500ms. UI feedback in < 2s.

## 3. CRITICAL LOGIC CONSTRAINTS (NEVER VIOLATE)
- **NEVER** allocate mixed genders in a single room.
- **NEVER** allocate students from different colleges in a single room.
- A room's `lockedCollegeId` is set on first allocation and cleared only when the room is empty.
- **NEVER** exceed room capacity. One user has at most one bed, and one bed has at most one user.
- **NEVER** relax gender/college rules to fix a capacity shortfall. Leave students unallocated and raise a `CAPACITY_SHORTFALL` alert.
- Manual overrides MUST pass the same validation. Only `ADMIN` may pass `forceException`, with a mandatory reason, logged to `AuditLog`.
- A user may redeem **each meal slot at most once** (`@@unique([userId, slotId])`).
- Meal eligibility = user's `(collegeId, gender)` matches the batch AND current time is inside the batch window (plus configured grace).
- **QR tokens contain identity only** (`sub`, `jti`, `v`, `iat`). NEVER put room, meal, gender or other sensitive data in a QR.
- Students receive notifications **only** for events they are registered for (plus personal account/allocation notices). Managers receive all global alerts.
- Never trust the client for role, mode, or eligibility. Re-check on the server.
- `AuditLog` is append-only. Never write UPDATE/DELETE code against it.

## 4. Tech Stack Decisions (Do Not Swap Without Approval)
| Layer | Choice |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript (strict), Tailwind, shadcn/ui, TanStack Query, Zustand |
| Scanner | PWA, `html5-qrcode`, Workbox offline queue |
| Backend | Node 20, NestJS (modular), REST + WebSocket/SSE |
| ORM / DB | Prisma + **PostgreSQL** (relational integrity is required) |
| Queue / Cache | Redis + BullMQ |
| Email | Amazon SES (or Resend) + React Email templates |
| Auth | JWT access (short) + refresh (httpOnly cookie), Argon2 |
| Validation | zod or class-validator on every DTO |
| Testing | Vitest/Jest, Supertest, Playwright, k6 |
| Hosting | Vercel (web), container host for API (ECS/Railway/Render), managed Postgres and Redis |

## 5. Domain Model (Summary)
`College 1─* User` · `User *─* Event (EventRegistration)` · `Hostel 1─* Room 1─* Bed` · `User 1─0..1 RoomAllocation ─ Bed` · `User 1─1 QrTicket 1─* ScanLog` · `MealSlot 1─* MealBatch(college, gender) 1─* MealLog` · `NotificationLog` · `AuditLog`.

Key uniques: `EventRegistration(userId,eventId)`, `RoomAllocation.userId`, `RoomAllocation.bedId`, `MealLog(userId,slotId)`, `MealBatch(slotId,collegeId,gender)`.

## 6. Allocation Algorithm (Implement Exactly)
1. Group unallocated users by `(collegeId, gender)`. Sort groups by size DESC.
2. For each group, candidate rooms: `room.gender == group.gender AND (room.lockedCollegeId == group.college OR IS NULL)`.
3. Fill partially occupied rooms of the same college first, then empty rooms (best fit).
4. Run each group in a **SERIALIZABLE** transaction with `SELECT ... FOR UPDATE` on candidate rooms.
5. Remainder with no valid bed becomes `UNALLOCATED` plus a shortfall report. Never place them in a non-matching room.
6. Support `dryRun`. Re-runs are incremental and must not move existing allocations.

## 7. QR & Scan Rules
- Verify signature, expiry, `v` against `QrTicket.version`, and rate limit, then load user.
- Modes: `HOSTEL_CHECKIN` (needs allocation, last state != IN), `HOSTEL_CHECKOUT` (last state == IN), `MEAL` (batch + window + not already redeemed).
- Accept a client-generated `clientScanId` for idempotency. Log **every** attempt in `ScanLog`.
- Error codes: `QR_INVALID`, `QR_EXPIRED`, `NO_ALLOCATION`, `ALREADY_CHECKED_IN`, `NOT_CHECKED_IN`, `MEAL_ALREADY_USED`, `MEAL_WRONG_BATCH`, `MEAL_OUTSIDE_WINDOW`, `ALLOCATION_RULE_VIOLATION`.

## 8. Notification Rules
- Flow: domain event → `resolveRecipients()` (pure, unit-tested) → render template → BullMQ → worker → provider → webhook updates `NotificationLog`.
- Dedup key `(userId, type, entityId, version)`. Coalesce rapid edits (60s window).
- Retries: exponential backoff, max 5, then dead-letter queue.
- Reminders at T-24h and T-1h are delayed jobs and MUST be rescheduled when an event time changes.

## 9. Directory Structure
```
/
├─ brain.md
├─ docs/                      # PRD, TRD, App Flow, UI/UX
├─ apps/
│  ├─ web/                    # Next.js app
│  │  ├─ app/
│  │  │  ├─ (auth)/           # login, register, verify
│  │  │  ├─ (student)/        # dashboard, events, my-qr, meals, schedule
│  │  │  ├─ (manager)/        # dashboard, events, hostel, meals, notify, audit
│  │  │  └─ scanner/          # scanner PWA route
│  │  ├─ components/{ui,events,hostel,meals,scanner}/
│  │  ├─ lib/{api,auth,realtime,offline-queue}/
│  │  └─ styles/
│  └─ api/                    # NestJS app
│     ├─ src/
│     │  ├─ modules/
│     │  │  ├─ auth/ users/ colleges/ events/
│     │  │  ├─ allocation/    # engine, validators, overrides
│     │  │  ├─ hostel/ qr/ meals/
│     │  │  ├─ notifications/ # resolver, templates, queue, webhooks
│     │  │  └─ audit/
│     │  ├─ common/{guards,filters,dto,errors}/
│     │  ├─ realtime/
│     │  └─ main.ts
│     ├─ prisma/{schema.prisma,migrations/,seed.ts}
│     └─ test/
├─ packages/
│  └─ shared/                 # shared types, zod schemas, constants (roles, error codes)
├─ infra/                     # docker-compose, IaC, CI workflows
└─ .github/workflows/
```

## 10. Coding Conventions
- TypeScript `strict: true`. No `any` without a justification comment.
- Business rules live in **services/domain functions**, never in controllers or React components.
- Every mutating endpoint: DTO validation, RBAC guard, transaction where needed, audit if privileged.
- Query-level scoping: students can only read their own rows.
- Errors use typed codes from `packages/shared`. Never leak stack traces.
- Time: store UTC, display in configured festival timezone.
- Tests required for: allocation engine (property tests for BR-1 to BR-5), `resolveRecipients`, scan verification, meal redemption idempotency.
- Never log PII, QR tokens or secrets.

## 11. UI Rules
- Mobile-first (360px). Scanner and student screens are phone-optimized.
- Scan results: full-screen **green ALLOWED** or **red DENIED + plain-language reason**, with icon, text and haptic (never colour alone).
- Gender and college are always shown on room headers and batch labels (♂/♀ + college code and colour).
- Palette: Indigo `#3B3FD9`, Marigold `#F5A524` (folk), Teal `#0FA3A3` (sports), Green `#16A34A`, Red `#DC2626`. Fonts: Poppins (headings), Inter (body).
- Invalid allocation drop targets are disabled with an explanatory tooltip.

## 12. Definition of Done (per feature)
- [ ] Business rules in Section 3 verified by automated tests
- [ ] DB constraints in place for any invariant
- [ ] RBAC and query scoping tested
- [ ] Audit entry for privileged actions
- [ ] Loading, empty, error and offline states implemented
- [ ] Accessibility checked (keyboard, contrast, ARIA live for results)
- [ ] Docs and this file updated if a decision changed

## 13. Out of Scope (v1)
Payments, live score streaming, native apps, SMS/WhatsApp, transport management.
