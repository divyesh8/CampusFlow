# CampusFlow Production Audit

Audit date: September 2, 2026

## Completed Work

### Database Schema (25 tables)

All tables created in `supabase/migrations/001_initial_schema.sql`:

- UUID primary keys on every table via `uuid_generate_v4()`
- Proper foreign key constraints with `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- Composite unique constraints where needed (e.g., `enrollments(user_id, subject_id, semester, academic_year)`)
- Indexes on all foreign keys and frequently queried columns
- `updated_at` trigger function applied to 14 tables
- Check constraints on enums (attendance status, assessment types, event categories, etc.)

Tables: `universities`, `profiles`, `campuses`, `university_connections`, `academic_years`, `semesters`, `subjects`, `enrollments`, `attendance_records`, `attendance_snapshots`, `assessments`, `marks`, `timetables`, `timetable_entries`, `timetable_overrides`, `academic_events`, `exams`, `assignments`, `clubs`, `campus_events`, `event_registrations`, `mess_menus`, `notifications`, `sync_logs`, `user_preferences`

### Row Level Security

All 25 tables have RLS enabled. Policies defined in `supabase/migrations/002_rls_policies.sql`:

- User-owned data (13 tables): `auth.uid() = user_id` pattern
- University-scoped read (6 tables): subquery join through `profiles` table
- Public read (2 tables: `universities`, `campuses`): `USING (true)`
- Total: 55 RLS policies covering SELECT, INSERT, UPDATE, DELETE as appropriate

### Security Fixes

| Fix | Location | Status |
|-----|----------|--------|
| Middleware route protection | `src/middleware.ts` + `src/lib/supabase/middleware.ts` | Implemented |
| Server-side session verification | `src/server/srm/session-manager.ts` (`requireSession()`, `getSession()`) | Implemented |
| httpOnly session cookie | `createSession()` sets `httpOnly`, `secure`, `sameSite: lax` | Implemented |
| `.env.example` documentation | `.env.example` documents all variables with security warnings | Implemented |
| `SUPABASE_SERVICE_ROLE_KEY` warning | Documented as never to be prefixed with `NEXT_PUBLIC_` | Documented |
| Input validation schemas | `src/lib/validations.ts` -- Zod schemas for all entities | Implemented |
| Auth verification in repositories | All repository functions verify `supabase.auth.getUser()` before queries | Implemented |

### Test Coverage

57 unit tests in `src/utils/calculations.test.ts`:

- `calculateAttendancePercentage`: 6 tests (normal, zero, 100%, 0%, rounding, edge)
- `calculateAttendanceStatus`: 5 tests (safe, warning, critical thresholds)
- `calculateCanBunk`: 4 tests (normal, at threshold, below, high attendance)
- `calculateMustAttend`: 4 tests (above, below, at threshold, very low)
- `calculateSimulatedAttendance`: 6 tests (attend, miss, extra, cancelled, multiple, empty)
- `getSubjectMarks`: 2 tests (grouping, empty)
- `getUpcomingExams`: 2 tests (filtering, sorting)
- `getAssignmentsDueToday`: 2 tests (filtering, excluding submitted)
- `sortByDeadline`: 1 test
- `getAcademicStanding`: 2 tests (normal, empty)
- `getGreeting`: 1 test
- `formatDate`: 2 tests (string, Date object)
- `formatTime`: 4 tests (afternoon, morning, midnight, noon)
- `daysUntil`: 3 tests (future, today, past)
- `getAttendanceTrend`: 2 tests (date range filtering, sorting)
- `getFreePeriods`: 3 tests (gaps, no gaps, empty)
- `getTimeUntil`: 3 tests (hours+minutes, past, minutes only)
- `getNextClass`: 3 tests (next class, no more, skip cancelled)
- `getChangesSinceLastVisit`: 2 tests (change log, empty)

### Repository Layer

8 data access modules in `src/lib/repositories/`:

| Repository | Operations | Status |
|------------|-----------|--------|
| `profile-repository.ts` | get, upsert, update | Implemented |
| `attendance-repository.ts` | getSubjectAttendance, getRecords, insert, delete | Implemented |
| `marks-repository.ts` | getSubjectMarks, insert, delete | Implemented |
| `timetable-repository.ts` | getEntries, getOverrides, createEntry, deleteEntry | Implemented |
| `assignment-repository.ts` | CRUD operations | Implemented |
| `exam-repository.ts` | CRUD operations | Implemented |
| `notification-repository.ts` | CRUD operations | Implemented |
| `preference-repository.ts` | CRUD operations | Implemented |

All repositories verify authenticated user via `supabase.auth.getUser()` before executing queries.

### Validation Schemas

15 Zod schemas in `src/lib/validations.ts`:

`loginSchema`, `signupSchema`, `onboardingSchema`, `profileUpdateSchema`, `attendanceInputSchema`, `marksInputSchema`, `assignmentSchema`, `examSchema`, `eventSchema`, `eventRegistrationSchema`, `messEntrySchema`, `timetableEntrySchema`, `notificationPreferencesSchema`, `userPreferencesSchema`, `universityConnectionSchema`

### UI Pages

14 fully implemented pages:

| Page | Route | Data Source |
|------|-------|-------------|
| Landing | `/` | Static |
| Login | `/login` | SRM auth (placeholder) |
| Onboarding | `/onboarding` | Local state |
| Dashboard | `/dashboard` | Session + demo |
| Attendance | `/attendance` | Placeholder (needs SRM) |
| Marks | `/marks` | Placeholder (needs SRM) |
| Timetable | `/timetable` | Placeholder (needs SRM) |
| Exams | `/exams` | Placeholder (needs SRM) |
| Assignments | `/assignments` | Demo data |
| Calendar | `/calendar` | Demo data |
| Events | `/events` | Demo data |
| Clubs | `/clubs` | Demo data |
| Mess | `/mess` | Demo data |
| Notifications | `/notifications` | Demo data |
| Analytics | `/analytics` | Demo data |
| Profile | `/profile` | Session data |
| Settings | `/settings` | Session data |

### Layout Components

- `AppShell`: Mobile-first layout with sticky header, sync button, notification bell, bottom nav
- `BottomNav`: 4 main items + "More" sheet with 8 additional items
- `Sidebar`: Desktop layout with grouped navigation and sign-out
- `CommandSearch`: Cmd+K search dialog with demo data
- `NotificationBell`: Popover with unread count and mark-all-read
- `CampusFlowLogo`: Brand component

## Known Limitations

### Data Layer

- **SRM sync is a no-op**: `POST /api/srm/sync` updates `lastSyncAt` but does not fetch any data from SRM
- **Dashboard shows placeholders**: Quick metrics display "--" with "Connect SRM to view" message
- **Attendance, marks, timetable, exams pages show empty states**: These pages display "SRM Integration Pending" banners and no data
- **Assignments, calendar, events, clubs, mess, analytics, notifications all use demo data**: Not connected to database
- **Session cookie stores base64 JSON**: Not encrypted; vulnerable to tampering if cookie signing is not added

### Authentication

- **SRM auth is a placeholder**: `POST /api/srm/auth` accepts any non-empty NetID and password, creates a session with a synthetic profile
- **No Supabase Auth signup flow**: Users cannot create Supabase accounts through the UI
- **Onboarding stores to localStorage only**: Profile data from onboarding is not persisted to Supabase

### Missing Features

| Feature | Status |
|---------|--------|
| Push notifications | Not implemented |
| Service worker / offline support | Not implemented |
| Data export | UI placeholder only |
| Account deletion | UI placeholder only |
| Real-time updates | Not implemented |
| Multi-university support | Only SRM configured |
| CAPTCHA handling for SRM login | Not implemented |
| Timetable override management | Schema exists, UI not implemented |
| Manual attendance entry UI | Repository exists, UI not implemented |
| Manual marks entry UI | Repository exists, UI not implemented |
| Manual exam entry UI | Repository exists, UI not implemented |
| Manual assignment entry UI | Repository exists, UI not implemented |
| Event registration flow | UI exists but not connected to database |
| Club detail view | "View Profile" button does nothing |

### PWA

- `manifest.json` exists with app metadata
- Icon files referenced (`icon-192.png`, `icon-512.png`) do not exist in `public/`
- No service worker registered

## Deployment Requirements

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # server-only
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_DEFAULT_PROVIDER=srm
NEXT_PUBLIC_APP_URL=<deployed-url>
```

### Supabase Setup

1. Create project
2. Run `001_initial_schema.sql` then `002_rls_policies.sql`
3. Configure auth settings (email/password, session timeout)

### Build

```bash
npm run build
```

No custom build steps. Vercel-compatible out of the box.

## Provider Limitations

### SRM Provider

- Authentication: Accepts credentials but does not communicate with SRM Academia
- Attendance: Returns `[]`
- Timetable: Returns `[]`
- Marks: Returns `[]`
- Exams: Returns `[]`
- Assignments: Returns `[]`
- Disconnect: Clears session cookie

To complete SRM integration, the following is needed:

1. Reverse-engineer SRM Academia login endpoint (form submission with CSRF tokens)
2. Handle CAPTCHA or MFA if present
3. Scrape attendance, marks, timetable, and exam pages after authentication
4. Normalize scraped HTML/JSON into CampusFlow types
5. Store normalized data in Supabase tables
6. Implement incremental sync (compare with existing data, generate notifications for changes)

### Manual Provider

- Students must enter all data manually through the UI
- CRUD operations available via repository layer
- No UI forms implemented for manual entry (only the repository functions exist)

### Demo Provider

- Hardcoded data in `src/utils/demo-data.ts`
- 5 subjects, 5 attendance records, 11 marks entries, 18 timetable entries, 5 exams, 5 assignments, 5 academic events, 4 campus events, 6 clubs, 1 mess menu, 5 notifications
- No database interaction
- Used when `NEXT_PUBLIC_DEMO_MODE=true`
