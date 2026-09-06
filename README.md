# CampusFlow

**Your SRM academics, simplified.**

CampusFlow is a mobile-first academic dashboard for SRM Institute of Science and Technology students. It consolidates attendance, marks, timetable, exams, assignments, campus events, and mess menus into a single fast interface. The platform is designed to work with a pluggable university provider system and currently targets SRM Academia.

## Features

| # | Feature | Status |
|---|---------|--------|
| 1 | Landing page with value proposition | Implemented |
| 2 | Login with NetID and password | Implemented; live-account verification required |
| 3 | Session management via httpOnly cookies | Implemented |
| 4 | Proxy-based route protection | Implemented |
| 5 | Dashboard with greeting, sync status, and quick metrics | Implemented; metrics are empty until the first sync |
| 6 | Attendance tracking with can-bunk / must-attend calculations | Implemented with SRM cumulative snapshots |
| 7 | Marks tracking with subject-wise assessment records | Implemented with SRM data |
| 8 | Course and slot view | Implemented; weekday/time requires a verified SRM timetable mapping |
| 9 | Exam schedule with preparation status | Partially implemented (UI placeholder; needs SRM data) |
| 10 | Assignment tracker with priority, due dates, and status toggle | Implemented (demo data) |
| 11 | Academic calendar (month and agenda views) | Implemented (demo data) |
| 12 | Campus events with category filters and registration | Implemented (demo data) |
| 13 | Club directory with social links | Implemented (demo data) |
| 14 | Mess menu for today and next two days | Implemented (demo data) |
| 15 | Notifications page with category colors and mark-all-read | Implemented (demo data) |
| 16 | Notification bell in header | Implemented (demo data) |
| 17 | Analytics with charts (bar, line, progress) | Implemented (demo data) |
| 18 | Profile page with student info display | Implemented |
| 19 | Settings (theme, attendance threshold, notifications, university integration) | Implemented (UI) |
| 20 | Onboarding flow (university, program, preferences) | Implemented |
| 21 | Command search (Cmd+K) | Implemented (demo data) |
| 22 | Responsive layout: mobile bottom nav + desktop sidebar | Implemented |
| 23 | Dark/light/system theme | Implemented |
| 24 | Zod validation schemas for all entities | Implemented |

## Architecture

```
campusflow/
  supabase/migrations/   -- SQL schema and RLS policies
  src/
    app/                 -- Next.js App Router pages and API routes
      (auth)/login/      -- Login page
      (main)/            -- Protected app pages (dashboard, attendance, marks, etc.)
      api/srm/           -- API routes for SRM auth, session, and sync
    components/          -- Shared UI components (shadcn/ui, layout, brand)
    config/              -- Constants (university list, event categories)
    hooks/               -- React hooks (useAuth)
    lib/
      repositories/      -- Data access layer (Supabase queries)
      supabase/          -- Supabase client setup (browser, server, middleware)
      validations.ts     -- Zod schemas
    providers/           -- University provider interface and implementations
    server/srm/          -- Server-side session manager
    types/               -- TypeScript interfaces
    utils/               -- Calculation functions, demo data
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Component Library | shadcn/ui + Radix primitives |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 3 |
| State Management | Zustand 5 |
| Forms / Validation | Zod 4 |
| Backend / Database | Supabase (PostgreSQL, Auth, RLS) |
| Session Management | Hashed opaque httpOnly cookie + encrypted Supabase session state |
| Testing | Vitest 4 |
| Language | TypeScript 5 |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (for database and auth)

### Installation

```bash
git clone <repo-url>
cd campusflow
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key (never expose to browser) |
| `NEXT_PUBLIC_DEMO_MODE` | Set to `true` for demo mode, `false` for production |
| `NEXT_PUBLIC_DEFAULT_PROVIDER` | Default university provider (`manual`, `srm`) |

### Database Setup

1. Create a new Supabase project
2. Run the migration files in order:

```bash
# In Supabase SQL Editor or via CLI:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
```

This creates 25 tables with UUID primary keys, foreign key constraints, indexes, and row-level security policies.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Testing

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
```

67 unit tests cover calculations, parser fixtures, normalized SRM data, migration persistence, duplicate prevention, student isolation, and rate limiting.

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Supabase Configuration

CampusFlow uses Supabase for:

- **PostgreSQL database**: 25 tables with proper foreign keys, indexes, and constraints
- **Row Level Security**: All private tables are protected so users can only access their own data
- **Server-side auth**: Next.js Proxy protects page routes; API routes verify the opaque session server-side
- **Realtime** (future): For live attendance and marks updates

The `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_`. It is only used in server-side code.

## Database Migrations

Four migration files in `supabase/migrations/`:

1. **001_initial_schema.sql** -- Creates all 25 tables, indexes, and `updated_at` triggers
2. **002_rls_policies.sql** -- Defines RLS policies for all tables
3. **003_srm_sessions.sql** -- Encrypted server-side SRM sessions and CAPTCHA challenges
4. **004_srm_pipeline.sql** -- Idempotent SRM component persistence, sync logs, rate limiting, and student isolation

Tables: `universities`, `profiles`, `campuses`, `university_connections`, `academic_years`, `semesters`, `subjects`, `enrollments`, `attendance_records`, `attendance_snapshots`, `assessments`, `marks`, `timetables`, `timetable_entries`, `timetable_overrides`, `academic_events`, `exams`, `assignments`, `clubs`, `campus_events`, `event_registrations`, `mess_menus`, `notifications`, `sync_logs`, `user_preferences`

## Row Level Security

Every private table has RLS enabled. Policies follow the pattern:

- **User-owned data** (attendance, marks, assignments, exams, etc.): `auth.uid() = user_id`
- **University-scoped read** (subjects, clubs, events, mess): `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.university_id = ...)`
- **Public read** (universities, campuses): `USING (true)`

No user can read or modify another user's private data through the Supabase client.

## Provider Architecture

CampusFlow supports multiple university backends through the `UniversityProvider` interface defined in `src/providers/index.ts`.

| Provider | Status | Notes |
|----------|--------|-------|
| **SRM** | Implemented pending live verification | Server-side login, CAPTCHA continuation, encrypted sessions, validated parsing, idempotent sync, and profile/attendance/marks/course reads. Real credentials and Supabase deployment are required for live verification. |
| **Manual** | Implemented | Students enter data directly into Supabase. Full CRUD via repository layer. |
| **Mock (Demo)** | Implemented | Hardcoded demo data used when `NEXT_PUBLIC_DEMO_MODE=true`. Provides realistic sample attendance, marks, timetable, exams, assignments, events, clubs, mess, and notifications. |

### Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` to run without Supabase or SRM credentials. Demo mode uses hardcoded data from `src/utils/demo-data.ts` and bypasses authentication checks.

**Important**: Demo mode is for development and preview only. It must be `false` in production.

## Testing

67 unit tests cover calculations, parser fixtures, normalized SRM data, migration persistence, duplicate prevention, student isolation, and rate limiting.

- Attendance percentage calculation (edge cases, rounding)
- Attendance status classification (safe/warning/critical)
- Can-bunk and must-attend calculations
- Simulated attendance with multiple actions
- Subject marks grouping and aggregation
- Exam filtering and sorting
- Assignment filtering and deadline sorting
- Academic standing computation
- Date/time formatting utilities
- Free period detection
- Next class lookup with override support
- Change log generation

Run with `npm run test`.

## PWA Support

Partial. A `manifest.json` exists in `public/` with app metadata and icon references, but the actual icon files (`icon-192.png`, `icon-512.png`) are missing. The app is otherwise PWA-ready with standalone display and portrait orientation configured.

## Deployment

CampusFlow is Vercel-compatible:

- Uses Next.js App Router (no custom server required)
- Environment variables configure Supabase connection
- No filesystem dependencies in production
- Middleware runs on the edge

Deploy with:

```bash
vercel deploy
```

Or connect your Git repository to Vercel for automatic deployments.

## Security

- **Proxy protection**: All non-public routes require a valid session (Supabase auth or CampusFlow `cf_session` cookie)
- **Server-side auth verification**: `getSession()` and `requireSession()` verify credentials on every server action and API route
- **httpOnly cookies**: Session data is stored in httpOnly, secure, SameSite=Lax cookies
- **RLS enforcement**: Database-level access control prevents cross-user data access
- **No secrets in client code**: `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser
- **Input validation**: Zod schemas validate all user inputs
- **Security headers**: Configured via Next.js middleware

## Known Limitations

- **Live SRM verification pending**: Local public reachability was verified, but no SRM credentials or deployed Supabase configuration are available in this workspace. Authentication and sync must still be verified against a real account.
- **Demo data only for most features**: Assignments, calendar, events, clubs, mess, analytics, and notifications use hardcoded demo data.
- **Course schedule mapping**: SRM course pages currently expose course/slot/room information; weekday and clock times are not invented until a verified timetable mapping is available.
- **No push notifications**: Browser push notifications are not implemented. The notification bell shows demo data only.
- **PWA icons missing**: manifest.json references icons that do not exist in `public/`.
- **No offline support**: No service worker or caching strategy.
- **No data export**: The "Export my data" button in settings is a UI placeholder.
- **No account deletion**: The "Delete my account" button in settings is a UI placeholder.
- **Single university**: Only SRM is configured in the university list.

## Future Roadmap

- Verify SRM Academia integration with a real account locally and on the deployed runtime
- Real-time sync with SRM portal (attendance, marks, timetable, exams)
- Server-side session store (replace cookie-based sessions)
- Push notifications for attendance alerts and exam reminders
- Service worker for offline access
- Data export (CSV/JSON)
- Account deletion flow
- Multi-university support (add VIT, Manipal, etc.)
- Community-contributed mess menus with verification
- Pluggable provider system for custom university integrations
