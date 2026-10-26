# UI/UX Design System & Screen Requirements
**Product:** UniFest Manager | **Version:** 1.0

---

## 1. Design Principles
1. **Glanceable status:** a green or red result must be readable from arm's length.
2. **Mobile-first:** students and scanner operators use phones. Manager dashboards scale up to desktop.
3. **Safety is visible:** gender and college are always shown with consistent colour and icon coding.
4. **Low cognitive load:** one primary action per screen.
5. **Accessible:** WCAG 2.1 AA, never rely on colour alone (pair with icons and text).

---

## 2. Color Palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | Festival Indigo | `#3B3FD9` | Primary buttons, links, active nav |
| Primary Dark | Midnight | `#1E1F5C` | Headers, dark surfaces |
| Accent | Marigold | `#F5A524` | Folk-event accent, highlights |
| Accent 2 | Teal | `#0FA3A3` | Sports-event accent |
| Success | Green | `#16A34A` | ALLOWED scans, confirmed |
| Warning | Amber | `#D97706` | Pending, near capacity |
| Danger | Red | `#DC2626` | DENIED scans, cancellations, rule violations |
| Neutral 900 | Ink | `#111827` | Primary text |
| Neutral 600 | Slate | `#4B5563` | Secondary text |
| Neutral 200 | Mist | `#E5E7EB` | Borders |
| Neutral 50 | Cloud | `#F9FAFB` | App background |
| Surface | White | `#FFFFFF` | Cards |

**Semantic tags**
| Tag | Colour | Icon |
|---|---|---|
| Sports event | Teal `#0FA3A3` | trophy |
| Folk event | Marigold `#F5A524` | music/drum |
| Male room/batch | Blue `#2563EB` | ♂ glyph + label "M" |
| Female room/batch | Magenta `#C026D3` | ♀ glyph + label "F" |
| College | Auto-assigned from a 12-colour categorical palette, always with the college code text |

**Dark mode:** supported via tokens (`--bg`, `--surface`, `--text`, `--border`). Scanner screen forces high-contrast mode.

---

## 3. Typography

| Use | Font | Weight / Size |
|---|---|---|
| Headings | **Poppins** (or Plus Jakarta Sans) | 600-700 / H1 28-32, H2 22-24, H3 18 |
| Body / UI | **Inter** | 400-500 / 14-16 |
| Numbers, QR codes, tables | **Inter** with tabular numerals, `JetBrains Mono` for IDs | 13-14 |
| Scanner result text | Poppins | 700 / 32-40 |

Line height 1.5 for body, 1.25 for headings. Minimum tap target 44x44px. Spacing scale: 4/8/12/16/24/32/48. Radius: 8px (inputs), 12px (cards), 9999px (pills).

---

## 4. Key Screens

### 4.1 Student Dashboard (Mobile-first)
**Purpose:** one place for "what's next".
```
┌──────────────────────────────┐
│ Hi, Aarav     [bell] [avatar]│
│ Punjab College · ♂           │
├──────────────────────────────┤
│ NEXT UP                      │
│ 100m Sprint · 4:30 PM        │
│ Main Track · starts in 1h 12m│
├──────────────────────────────┤
│ [ My QR ]  (large primary)   │
├──────────────────────────────┤
│ STAY      Hostel B · Room 214│
│           Bed 3 · Checked in │
│ MEALS     Lunch 12:30-12:50  │
│           Batch B  [Open]    │
├──────────────────────────────┤
│ MY SCHEDULE (tabs by day)    │
│ • Folk Dance 10:00 [Changed!]│
│ • 100m Sprint 16:30          │
├──────────────────────────────┤
│ Home | Events | My QR | Meals│
└──────────────────────────────┘
```
**Requirements**
- "Next Up" card with live countdown, and a changed/cancelled badge updated in real time.
- "My QR" opens full-screen QR with max brightness prompt, name, college, and last-scan status.
- Room card states: *Pending*, *Allocated*, *Checked in*, *Checked out*.
- Meal card states: *Upcoming*, *Open now*, *Redeemed*, *Missed*.
- Empty states with guidance (e.g., "Register for events to see your schedule").

### 4.2 Manager Dashboard (Desktop-first, responsive)
```
┌────────┬─────────────────────────────────────────────┐
│ Nav    │ KPI row: Registered | Allocated | Checked-in │
│ Events │          | Meals served | Alerts              │
│ Hostel ├──────────────────────┬──────────────────────┤
│ Meals  │ Live Events          │ Alert Feed           │
│ Scans  │ (status, venue,      │ ! Capacity shortfall │
│ Notify │  registrations)      │   College X (F): 6   │
│ Audit  │                      │ ! Event 42 changed   │
│        ├──────────────────────┴──────────────────────┤
│        │ Occupancy by hostel (bar) | Meals by batch   │
│        │ Recent scans (table, live)                   │
└────────┴─────────────────────────────────────────────┘
```
**Requirements**
- Real-time KPI tiles, with click-through to detail.
- Alert feed with severity, timestamp, and one-click action (e.g., "Open allocation").
- Quick actions: *New event*, *Run allocation*, *Broadcast*, *Open scanner*.
- Global filters: day, college, gender.

### 4.3 QR Scanner View (Mobile/Tablet, full-screen)
```
┌──────────────────────────────┐
│ Mode: [Hostel IN|OUT|Meal▼]  │
│ Slot: Lunch (auto)  ● Online │
├──────────────────────────────┤
│        ┌──────────┐          │
│        │ camera   │          │
│        │ viewfinder│         │
│        └──────────┘          │
├──────────────────────────────┤
│ Last scan:                   │
│ ██ ALLOWED ██ (full green)   │
│ Aarav S. · Punjab College · M│
│ Hostel B · Room 214          │
├──────────────────────────────┤
│ Today: 142 scanned  [History]│
│ [Torch] [Manual ID] [Help]   │
└──────────────────────────────┘
```
**Requirements**
- Result overlays the full screen for ~2s: **green + check + name** or **red + X + reason**, with haptic and optional sound.
- Large mode selector locked behind a confirm to avoid accidental changes.
- Continuous scanning (auto re-arm), torch toggle, manual lookup by ID or email fallback.
- Offline badge and queued count, with a sync indicator.
- Denied reasons in plain language: "Already used lunch at 12:41", "Batch C opens at 1:10 PM".

### 4.4 Room Allocation Matrix (Manager)
```
Hostel B (Male)   ▸ Floor 2
┌───────┬─────────┬─────────┬─────────┬─────────┐
│ Room  │ Bed 1   │ Bed 2   │ Bed 3   │ Bed 4   │
├───────┼─────────┼─────────┼─────────┼─────────┤
│ 214   │[PCE]Ravi│[PCE]Amit│[PCE]Aarav│ empty  │ ← locked: PCE
│ 215   │[LPU]... │[LPU]... │ empty   │ empty   │ ← locked: LPU
│ 216   │ empty   │ empty   │ empty   │ empty   │ ← unlocked
└───────┴─────────┴─────────┴─────────┴─────────┘
Side panel: Unallocated (3) · Shortfall: PCE-F needs 6 beds
```
**Requirements**
- Grid grouped by hostel > floor > room, **colour by college**, gender badge on every room header, a lock icon showing the room's college lock.
- Filters: college, gender, hostel, status (full/partial/empty, checked-in).
- **Drag-and-drop or "Move" dialog** with live validation. Valid drop targets highlight green, invalid ones are greyed out with a tooltip ("Gender mismatch" / "Room locked to LPU" / "Room full").
- Dry-run preview mode with a diff of proposed changes before commit.
- Override requires a **reason** field and shows an "Audited" notice.
- Summary bar: allocated / total beds, unallocated count, shortfall by (college, gender).

### 4.5 Additional Screens (Brief)
| Screen | Key Content |
|---|---|
| Event List / Detail | Filters, status badges, registration button, venue map link, live update banner |
| Event Editor (Manager) | Form with validation, clash detector, "N students will be notified" summary |
| Meal Planner | Slot grid, auto-batch generator, editable time windows |
| Meal Live Board | Counters per batch, progress bars, recent redemptions |
| Notifications Center | Broadcast composer, audience selector, delivery status table |
| Audit Log (Admin) | Filterable table: actor, action, before/after, reason |
| Auth Screens | Register (college and gender fields with helper text on why they are needed), login, verify email |

---

## 5. Core UI Components

| Component | Variants / Notes |
|---|---|
| **Button** | Primary, Secondary, Ghost, Danger. Sizes sm/md/lg. Loading spinner state |
| **Input / Select / Combobox** | College searchable combobox. Inline validation |
| **Card** | Event card, Stat tile, Room card, Alert card |
| **Badge / Pill** | Status (Live, Cancelled, Changed), Gender, College code, Sport/Folk |
| **QR Display** | Large QR, name, college, refresh state, brightness hint |
| **Scan Result Overlay** | Allowed / Denied full-screen, with reason and auto-dismiss |
| **Data Table** | Sort, filter, pagination, export, sticky header |
| **Allocation Grid Cell** | Empty, Occupied, Selected, Valid target, Invalid target, Checked-in marker |
| **Toast / Banner** | Info, success, warning, error. Persistent banner for offline mode |
| **Modal / Drawer** | Confirm override (with reason textarea) |
| **Tabs / Day Picker** | Schedule by day |
| **Skeleton / Empty State** | For every list and dashboard tile |

---

## 6. Interaction States

| State | Behaviour |
|---|---|
| **Default / Hover / Focus / Active** | Focus ring 2px Indigo, never removed. Hover only on pointer devices |
| **Disabled** | 40% opacity plus tooltip explaining why (e.g., "Registration closed") |
| **Loading** | Skeletons for content, spinners for buttons, optimistic updates for registration |
| **Empty** | Illustration, one-line explanation, primary CTA |
| **Error** | Inline message with the fix and a retry. Full-page fallback with a support contact |
| **Success** | Toast plus state change. Scan success includes haptic |
| **Real-time update** | Subtle highlight flash on changed rows or cards (respects reduced-motion) |
| **Offline** | Banner, queued actions count, disabled server-only actions |
| **Permission denied** | Clear message and route back, never a blank page |
| **Destructive action** | Confirmation modal naming the impact ("12 students will be emailed") |

---

## 7. Accessibility & Responsiveness
- Contrast ≥ 4.5:1 for text. Scan results combine colour, icon and text.
- Full keyboard navigation for manager screens. ARIA live regions for real-time alerts and scan results.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Breakpoints: 360 / 768 / 1024 / 1440. Student and scanner screens are designed at 360 first.
- Localization-ready (i18n keys, date/time formatted per locale, IST default timezone configurable).
