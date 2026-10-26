# Product Requirements Document (PRD)
**Product:** UniFest Manager: Inter-College Sports & Folk Events Platform
**Version:** 1.0 | **Status:** Ready for development handoff

---

## 1. Executive Summary & Vision

### 1.1 Problem
Inter-college sports and folk festivals bring hundreds or thousands of participants from many institutions to one campus. Organizers typically run events, accommodation and meals on spreadsheets, WhatsApp groups and paper lists. This causes:
- Missed or changed event timings that never reach the right people
- Mixed-gender or mixed-college room allotments, which creates safety and coordination problems
- Long, chaotic queues at hostel desks and mess halls
- No single source of truth for who is where, who has eaten, and who has checked in

### 1.2 Vision
One platform where organizers publish events, the system **automatically and safely** allocates hostel rooms (same college, same gender, always), and every participant uses a **single QR identity** for hostel check-in/out and meals, with alerts only for what concerns them.

### 1.3 Product Principles
1. **Safety first:** gender and college separation rules are hard constraints, never soft preferences.
2. **One QR, many uses:** a participant carries one identity; scanners resolve the context (hostel or meal).
3. **Relevant noise only:** students get alerts for their events only; managers get everything.
4. **Operational speed:** a scan must complete in under 2 seconds and work on a phone browser.
5. **Human override with audit:** managers can override the algorithm, but every override is logged.

### 1.4 Scope
**In scope (v1):** event management, email notifications, hostel allocation and QR check-in/out, meal QR access and batching, manager/admin dashboards, audit logs.
**Out of scope (v1):** payments, live score streaming, native mobile apps, SMS/WhatsApp notifications, transport management.

---

## 2. Target Audience

| Persona | Description | Primary Goals |
|---|---|---|
| **Student / Participant** | Representative of a college in one or more events | Know where/when to play or perform, get a room, check in fast, eat on schedule |
| **Manager / Organizer** | Festival staff, hostel wardens, mess coordinators | Publish events, monitor attendance, resolve allocation issues, run scanners |
| **System Admin** | Technical/administrative owner | Manage colleges, roles, hostel inventory, system config, audit logs |
| **Scanner Operator** (Manager sub-role) | Volunteer at hostel gate or mess entrance | Scan QR codes quickly and see clear allow/deny results |

---

## 3. Core Epics & User Stories

Priority: **P0** = launch blocker, **P1** = important, **P2** = nice to have.

### Epic 1: Authentication, Registration & Profiles
| ID | User Story | Priority |
|---|---|---|
| AUTH-1 | As a student, I can register with my name, email, phone, **college**, and **gender** so the system can allocate me correctly. | P0 |
| AUTH-2 | As a student, I verify my email via a link/OTP before I can register for events. | P0 |
| AUTH-3 | As an admin, I can create manager accounts and assign roles (Manager, Scanner Operator). | P0 |
| AUTH-4 | As a manager, I can bulk-import participants per college via CSV. | P1 |
| AUTH-5 | As a student, my gender and college are locked after allocation, and only a manager can change them (audited). | P0 |

### Epic 2: Event Management
| ID | User Story | Priority |
|---|---|---|
| EVT-1 | As a manager, I can create a sports or folk event with title, category, description, date, start/end time, venue, capacity, and rules. | P0 |
| EVT-2 | As a manager, I can edit time/venue and the change is pushed in real time to the app and triggers notifications to registered students. | P0 |
| EVT-3 | As a student, I can browse the event schedule by day, category and venue. | P0 |
| EVT-4 | As a student, I can register or withdraw (until a cutoff) from events. | P0 |
| EVT-5 | As a manager, I can mark an event as Scheduled / Live / Completed / Cancelled / Postponed. | P0 |
| EVT-6 | As a manager, I can see registrations per event, per college. | P1 |
| EVT-7 | As a student, I see a "My Schedule" view with conflict warnings for overlapping events. | P1 |

### Epic 3: Notifications & Alerts
| ID | User Story | Priority |
|---|---|---|
| NOT-1 | As a student, I receive emails **only** for events I registered for (change, cancel, reminder, result/status). | P0 |
| NOT-2 | As a manager, I receive all global alerts (new registrations summary, event changes, capacity breaches, allocation failures, scan anomalies). | P0 |
| NOT-3 | As a manager, I can send a broadcast email to all, a college, a gender, or registrants of an event. | P1 |
| NOT-4 | As a student, I get automatic reminders (default 24h and 1h before event). | P1 |
| NOT-5 | As a manager, I can see email delivery status (queued/sent/failed/bounced). | P1 |
| NOT-6 | As a student, I can opt out of non-critical reminders. Critical changes are always sent. | P2 |

### Epic 4: Smart Hostel Allocation & Management
| ID | User Story | Priority |
|---|---|---|
| HOS-1 | As an admin, I can define hostels, floors, rooms, capacity (beds), and gender designation. | P0 |
| HOS-2 | As a manager, I can run auto-allocation that places students **only with others from the same college AND same gender**. | P0 |
| HOS-3 | As a manager, I see an allocation matrix (rooms x occupants) with college and gender colour coding. | P0 |
| HOS-4 | As a manager, I can override or move a student, and the system **blocks** any move that violates gender/college rules unless an Admin gives an explicit, audited exception. | P0 |
| HOS-5 | As a student, I see my hostel, room and bed after allocation. | P0 |
| HOS-6 | As a student, I check in and out via QR scanned by a hostel operator. | P0 |
| HOS-7 | As a manager, I see live occupancy (checked-in / allocated / vacant). | P0 |
| HOS-8 | As a manager, I get an alert if capacity is insufficient for a college/gender group. | P0 |
| HOS-9 | As a manager, I can re-run allocation for newly registered students without disturbing existing allocations. | P1 |

### Epic 5: Meal Management
| ID | User Story | Priority |
|---|---|---|
| MEA-1 | As a manager, I can define meal slots (breakfast/lunch/dinner/snacks) per day with time windows. | P0 |
| MEA-2 | As a manager, I can generate **meal batches** grouped by college and gender, each with an assigned time window. | P0 |
| MEA-3 | As a student, I see my meal batch time for each slot. | P0 |
| MEA-4 | As a scanner operator, I scan a student's QR and see **Allowed / Already Used / Wrong Batch / Not Eligible**. | P0 |
| MEA-5 | As a manager, I see live meal counts per slot, per batch, and per college. | P0 |
| MEA-6 | As a manager, I can grant a one-time meal exception (audited). | P1 |
| MEA-7 | As a manager, I can export meal logs for reconciliation. | P1 |

### Epic 6: Admin, Audit & Reporting
| ID | User Story | Priority |
|---|---|---|
| ADM-1 | As an admin, I can manage colleges and roles. | P0 |
| ADM-2 | As an admin, I can view an immutable audit log (overrides, exceptions, role changes). | P0 |
| ADM-3 | As a manager, I can export CSV reports (registrations, allocations, check-ins, meals). | P1 |

---

## 4. Business Rules (Authoritative)

| # | Rule |
|---|---|
| BR-1 | **A room never holds mixed genders.** |
| BR-2 | **A room never holds students from more than one college.** |
| BR-3 | A room's gender and college become **locked** when its first occupant is assigned, and unlock only when it is empty. |
| BR-4 | Occupancy never exceeds room capacity. |
| BR-5 | A student can hold only one active bed allocation per festival. |
| BR-6 | A QR token is valid only for its festival and identifies a user; scan context (hostel or meal) is decided server-side. |
| BR-7 | A student may use each meal slot **at most once**. |
| BR-8 | Meal batches are grouped by (college, gender), and a student can only redeem during their batch window (plus a configurable grace period). |
| BR-9 | Students receive notifications only for events they are registered for (plus essential account/allocation notices addressed to them personally). |
| BR-10 | Every manual override must carry a reason and be written to the audit log. |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Page load < 2.5s on 4G; QR scan verification p95 < 500ms server-side; allocation of 2,000 students < 30s |
| **Scalability** | Support 5,000 registered users and 500 concurrent users; burst of 300 scans/minute at meal peaks |
| **Availability** | 99.5% during the festival window; graceful degradation if email provider is down (queue and retry) |
| **Security** | HTTPS only; RBAC; signed, expiring QR tokens; rate limiting; input validation; OWASP Top 10 hardening; password hashing (Argon2/bcrypt) |
| **Privacy** | Collect minimal PII; encrypt at rest; restrict gender/phone visibility to authorized roles; data retention policy |
| **Reliability** | Idempotent scans (duplicate scans never double-count); transactional allocation; daily DB backups |
| **Usability** | Mobile-first; WCAG 2.1 AA; scanner screen usable one-handed in bright sunlight |
| **Offline tolerance** | Scanner PWA can queue scans briefly on network drop and sync with conflict resolution (P1) |
| **Observability** | Structured logs, error tracking, metrics on scans, queue depth, email failures |
| **Compatibility** | Latest 2 versions of Chrome, Safari, Firefox, Edge; Android and iOS browsers with camera access |

---

## 6. Success Metrics

| Area | Metric | Target |
|---|---|---|
| Rule integrity | Rooms violating gender/college rules | **0** |
| Allocation | Students auto-allocated without manual intervention | ≥ 95% |
| Check-in speed | Average QR check-in time | < 5 seconds per student |
| Meals | Average mess queue wait time | ≤ 5 minutes |
| Meals | Duplicate meal redemptions | 0 |
| Notifications | Email delivery success rate | ≥ 98% |
| Notifications | Notification latency after event change | < 60 seconds |
| Adoption | Registered students who log in at least once | ≥ 90% |
| Satisfaction | Manager satisfaction (post-event survey) | ≥ 4.2 / 5 |
| Reliability | Scan-related support incidents | < 1% of scans |

---

## 7. Assumptions, Risks & Open Questions

**Assumptions**
- Gender is collected as a binary Male/Female field for room segregation. The system stores it as an enum that can be extended per institutional policy.
- Hostel inventory is known before allocation begins.
- Students have a smartphone or can present a printed QR.

**Risks**
| Risk | Mitigation |
|---|---|
| Not enough rooms for a small college or gender group | Allocation reports shortage early, never relaxes rules; manager alerted to add rooms |
| Poor network at scan points | PWA with offline queue, local caching of eligibility lists |
| Email deliverability issues | Dedicated sender domain with SPF/DKIM, retry queue, delivery tracking |
| QR sharing or screenshots | Signed, rotating tokens, scan logs, optional ID check at scanner |

**Open Questions**
1. Is gender data required to support options beyond Male/Female per institutional policy?
2. Are team officials/coaches (non-participants) housed in the same system?
3. Is there a fixed maximum number of days per festival (affects slot generation)?
