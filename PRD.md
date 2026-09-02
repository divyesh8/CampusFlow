# CampusFlow — Product Requirement Document

**Version:** 1.0
**Date:** September 2, 2026
**Status:** MVP Phase 1-5 Complete

---

## 1. Product Overview

CampusFlow is a student academic and campus companion web application. It consolidates attendance tracking, marks, timetable, exams, assignments, campus events, and mess menus into a single dashboard — eliminating the need for students to juggle multiple university portals, WhatsApp groups, calendars, and apps.

**Temporary project name:** CampusFlow (globally replaceable)

**Tagline:** "Everything about college. One dashboard."

---

## 2. Target Users

- **Primary:** University students (initially SRM University optimized, architecture supports any university)
- **Secondary:** Campus event organizers (Phase 6)
- **Tertiary:** University administrators (future)

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, React 19, Tailwind CSS 4 |
| UI Components | shadcn/ui (20+ components) |
| Icons | Lucide React |
| Charts | Recharts |
| State | React Context + hooks |
| Validation | Zod (available, types enforce structure) |
| Auth | localStorage-based (Supabase-ready) |
| Database | Supabase PostgreSQL (schema-ready) |
| Deployment | Vercel-compatible |
| PWA | manifest.json (partial — icons missing) |

---

## 4. Implementation Status

### 4.1 Fully Implemented (24/25 items)

| # | Feature | Requirement | Status |
|---|---------|-------------|--------|
| 1 | Landing Page | Hero, features, CTA, footer | COMPLETE |
| 2 | Login Page | University selector, student ID, email, password, manual account, privacy text | COMPLETE |
| 3 | Onboarding | 3-step wizard: university, academic info, preferences | COMPLETE |
| 4 | Dashboard | Greeting, next class widget, 4 metric cards, attendance risk, since last visit, due today, mess, events | COMPLETE |
| 5 | Attendance System | Subject-wise display, safe/warning/critical status, progress bars | COMPLETE |
| 6 | Can I Bunk Calculator | Calculate max consecutive skips per subject | COMPLETE |
| 7 | Attendance Recovery Calculator | Calculate classes needed to reach threshold | COMPLETE |
| 8 | Attendance Simulator | Attend/miss simulation with live prediction | COMPLETE |
| 9 | Attendance Trends | Line charts (7d, 30d, semester) | COMPLETE |
| 10 | Timetable | Day view, week selector, next class, free periods, stats | COMPLETE |
| 11 | Marks | Subject-wise marks, assessment breakdown, percentage, bar chart | COMPLETE |
| 12 | Target Score Calculator | Desired score → required marks per subject | COMPLETE |
| 13 | Calendar | Month view with events, agenda view | COMPLETE |
| 14 | Exams | Upcoming exams, countdown, preparation status | COMPLETE |
| 15 | Assignments | Deadline-sorted, priority, status toggle, overdue detection | COMPLETE |
| 16 | Events | Category filtering, registration, club info | COMPLETE |
| 17 | Clubs | Club profiles, categories, social links | COMPLETE |
| 18 | Mess Menu | Today/tomorrow/day-after, 4 meals | COMPLETE |
| 19 | Analytics | Attendance health, semester progress, performance overview | COMPLETE |
| 20 | Notifications | Bell with unread count, categories, mark-as-read | COMPLETE |
| 21 | Profile | Student info, university connection status | COMPLETE |
| 22 | Settings | Theme, academic, notifications, integration, data export/delete | COMPLETE |
| 23 | Search (Cmd+K) | Global search with keyboard shortcut | COMPLETE |
| 24 | Dark/Light Mode | Light, dark, system with persistence | COMPLETE |

### 4.2 Partially Implemented (1/25 items)

| # | Feature | What Exists | What's Missing |
|---|---------|-------------|----------------|
| 25 | PWA | manifest.json with metadata | Icon files (192px, 512px), service worker registration |

---

## 5. Detailed Feature Specifications

### 5.1 Authentication & Onboarding

**Login Page** (`/login`)
- Two modes: University Login / Manual Account
- University selector dropdown (SRM, VIT, Manipal, Other)
- Fields: Student ID, Email, Password
- Demo mode indicator when `NEXT_PUBLIC_DEMO_MODE=true`
- Privacy text: "Your academic information belongs to you."

**Onboarding** (`/onboarding`)
- 3-step wizard with progress indicator
- Step 1: University + Campus
- Step 2: Program, Department, Year, Semester, Section
- Step 3: Attendance threshold (70/75/80/85%)

### 5.2 Dashboard

**Priority Algorithm:** Information sorted by urgency:
1. Critical attendance warning
2. Class starting soon
3. Exam within 48 hours
4. Assignment due today
5. Timetable change
6. New marks
7. Events

**Widgets:**
- Greeting + date
- Next class card (subject, time, room, faculty, countdown)
- 4 metric cards (Attendance %, Marks, Classes Today, Next Exam)
- Attendance risk alert (red card for critical subjects)
- "Since last visit" changes
- Due today assignments
- Mess today preview
- Upcoming events

### 5.3 Attendance System

**Core Metrics per Subject:**
- Subject name + code
- Attended / Conducted count
- Percentage
- Status: Safe (>threshold+5), Warning (≥threshold), Critical (<threshold)

**Calculators:**
- **Can I Bunk:** `max x where attended/(conducted+x) ≥ threshold`
- **Recovery:** `min x where (attended+x)/(conducted+x) ≥ threshold`
- **Simulator:** Add attend/miss actions, see live predicted percentage

**Charts:** Line chart showing attendance trend over 7 days

### 5.4 Timetable

**Views:**
- Day view (default, sorted by time)
- Week selector (Mon-Sun buttons)

**Smart Features:**
- Current class highlight
- Next class highlight
- Past class dimming
- Free period detection
- Total classroom hours
- Class count

### 5.5 Marks

**Display:**
- Subject-wise grouped marks
- Assessment breakdown (exam, assignment, lab)
- Total obtained / Total max
- Percentage with color coding

**Analytics:**
- Bar chart (subject-wise performance)
- Highest/lowest subject
- Average score

**Target Calculator:**
- Input desired final score
- Output: required marks in remaining assessments per subject

### 5.6 Calendar

**Views:**
- Month grid with navigation
- Agenda list (upcoming)

**Events Combined:**
- Academic events (holidays, registration)
- Exams
- Assignments (due dates)
- Campus events

### 5.7 Exams

**Display:**
- Upcoming exams sorted by date
- Subject, name, date, time, room
- Countdown badges ("6 days", "Tomorrow", "Today")
- Preparation status (Not Started / Revising / Ready)

**Stats:**
- Next exam
- Total upcoming
- Days between exams
- Subjects remaining

### 5.8 Assignments

**Fields:**
- Title, Subject, Due date, Description, Status, Priority

**Status:** Not started → In progress → Submitted (toggleable)

**Priority:** Low / Medium / High (color-coded)

**Sorting:** Automatic by nearest deadline

**Filters:** All / Pending / Submitted

### 5.9 Events & Clubs

**Events:**
- Category filter (technical, cultural, sports, workshop, hackathon, career, club, fest)
- Registration status, capacity (registered/limit)
- Register / View Ticket buttons

**Clubs:**
- Profile cards with name, description, category
- Social links (website, social media)
- Category badges (9 categories)

### 5.10 Mess Menu

**Meals:** Breakfast, Lunch, Snacks, Dinner

**Navigation:** Today / Tomorrow / Next day

**Data:** Community-verified notice

### 5.11 Analytics

**Sections:**
- Attendance Health (good/warning/critical counts)
- Semester Progress (current week / total weeks)
- Assessment Performance (average, highest, lowest)

### 5.12 Notifications

**Categories:** Attendance, Marks, Timetable, Exam, Assignment, Event, System

**Actions:** Mark as read, Mark all read, View details links

### 5.13 Settings

**Sections:**
- Appearance (Light/Dark/System)
- Academic (Attendance threshold)
- Notifications (6 toggle switches)
- University Integration (connected account, reconnect, sync)
- Data (Export, Delete account)

---

## 6. Architecture

### 6.1 Directory Structure

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx          # Auth guard + AppShell
│   │   ├── dashboard/page.tsx
│   │   ├── attendance/page.tsx
│   │   ├── marks/page.tsx
│   │   ├── timetable/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── exams/page.tsx
│   │   ├── assignments/page.tsx
│   │   ├── events/page.tsx
│   │   ├── clubs/page.tsx
│   │   ├── mess/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── landing/page.tsx
│   ├── onboarding/page.tsx
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Root redirect
│   └── globals.css
├── components/
│   ├── ui/                     # 20+ shadcn components
│   ├── layout/                 # sidebar, bottom-nav, app-shell
│   ├── auth-provider.tsx
│   ├── theme-provider.tsx
│   ├── notifications/
│   └── search/
├── hooks/
│   └── use-auth.ts
├── providers/
│   └── index.ts                # UniversityProvider interface
├── types/
│   └── index.ts                # 30+ type definitions
├── utils/
│   ├── calculations.ts         # All business logic
│   └── demo-data.ts            # Demo data
├── config/
│   └── constants.ts
└── lib/
    ├── supabase.ts
    └── utils.ts
```

### 6.2 Provider Architecture

```typescript
interface UniversityProvider {
  authenticate(credentials): Promise<{success, error?}>
  getStudentProfile(): Promise<StudentProfile | null>
  getAttendance(subjectIds): Promise<SubjectAttendance[]>
  getTimetable(): Promise<TimetableEntry[]>
  getMarks(): Promise<Mark[]>
  getExams(): Promise<Exam[]>
  getAssignments(): Promise<Assignment[]>
}
```

Providers: `SRMProvider`, `ManualProvider`, `MockProvider`

### 6.3 Demo Mode

Enabled via `NEXT_PUBLIC_DEMO_MODE=true`. Provides:
- Demo student: Alex Kumar, B.Tech CSE, Semester 3
- 5 subjects with realistic attendance/marks
- Full timetable (Mon-Fri)
- 5 exams, 5 assignments, 4 campus events, 6 clubs
- Mess menu, notifications

---

## 7. What's NOT Built (V1 Scope Exclusions)

Per spec section 60, these are excluded from V1:

| Item | Status |
|------|--------|
| AI chatbot | Not built |
| Social feed | Not built |
| Student messaging | Not built |
| Marketplace | Not built |
| Dating features | Not built |
| Leaderboards | Not built |
| Large gamification | Not built |
| Recommendation engines | Not built |
| Organizer portal (`/organizer`) | Not built (Phase 6) |
| Timetable overrides UI | Data model exists, UI not built |
| ICS/PNG/PDF export | Not built |
| Offline service worker | Not built |
| Supabase RLS policies | Not built (needs real Supabase project) |
| Database migrations SQL | Not generated |
| Zod validation schemas | Not written for forms |
| Tests | Not written |
| README documentation | Not written |

---

## 8. What Needs To Be Done Next

### Phase 6 (Organizer Portal)
- `/organizer` routes
- Event creation/editing
- Registration management
- QR check-in
- Attendance tracking

### Production Readiness
- [ ] Supabase project setup + migration SQL
- [ ] RLS policies
- [ ] Real auth integration (Supabase Auth)
- [ ] Service worker for offline support
- [ ] PWA icon generation (192px, 512px)
- [ ] ICS calendar export
- [ ] Timetable PDF/PNG export
- [ ] Zod validation schemas for all forms
- [ ] Unit tests for calculation functions
- [ ] Integration tests
- [ ] README with setup instructions
- [ ] `.env.example` documentation
- [ ] Error boundaries per page
- [ ] Loading skeletons (partially done via shadcn)
- [ ] SEO meta tags for public pages
- [ ] Rate limiting on API routes
- [ ] CSRF protection

---

## 9. Environment Variables

```
NEXT_PUBLIC_APP_NAME=CampusFlow
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEFAULT_PROVIDER=manual
```

---

## 10. Security Considerations

- No university passwords logged
- No credentials in client bundles
- Demo mode uses localStorage only
- Supabase keys in env vars
- Provider abstraction prevents direct university API exploitation
- No CAPTCHA bypass code
- No credential persistence without explicit design

---

## 11. Accessibility

- Semantic HTML throughout
- Keyboard navigation (Cmd+K search)
- Visible focus states (shadcn defaults)
- ARIA labels on interactive elements
- Status indicators use text + color (not color alone)
- 44px minimum touch targets on mobile

---

## 12. Performance Targets

- Static page generation for all routes
- Route-level code splitting (Next.js default)
- No unnecessary client-side JavaScript
- Demo data loaded from constants (no network requests)
- Tailwind CSS purging unused styles

---

## 13. Build Status

```
✓ Compiled successfully
✓ TypeScript passed (0 errors)
✓ Static pages generated (21/21)
✓ Lint passed
```

**Pages:** 19 routes, all statically generated
**Components:** 20+ shadcn/ui + 10 custom components
**Types:** 30+ TypeScript interfaces
**Utilities:** 18 calculation functions
