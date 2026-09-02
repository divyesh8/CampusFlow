# REAL_DATA_MIGRATION.md — CampusFlow Audit Report

## Current State Summary

CampusFlow is a Next.js 16 PWA using Supabase, Zustand, Tailwind CSS, and shadcn/ui components. It currently functions as a **demo academic dashboard** with entirely fictional data.

---

## 1. Fake Authentication

| Issue | Location | Details |
|-------|----------|---------|
| localStorage auth | `src/hooks/use-auth.ts` | Stores `campusflow_user` in localStorage, never validates against SRM |
| Fake user lookup | `src/hooks/use-auth.ts:50-53` | Looks up user from localStorage `campusflow_users` object |
| No real SRM auth | `src/providers/index.ts:83-113` | `SRMProvider.authenticate()` always returns `{ success: false, error: "SRM provider is not yet integrated" }` |
| DEMO_MODE auto-login | `src/hooks/use-auth.ts:28-31` | If `DEMO_MODE=true`, sets `DEMO_STUDENT` as user |
| Manual account | `src/hooks/use-auth.ts:59-89` | Creates user in localStorage with random IDs |
| Supabase not used for auth | `src/lib/supabase/middleware.ts` | Middleware checks Supabase user but client-side uses localStorage |

**Auth flow:** Login → localStorage check → DEMO_STUDENT if demo mode → no SRM interaction

---

## 2. Demo Data Sources

| Demo Constant | File | Imported By |
|---------------|------|-------------|
| `DEMO_STUDENT` | `src/utils/demo-data.ts:15` | `use-auth.ts` |
| `DEMO_ATTENDANCE` | `src/utils/demo-data.ts:35` | `dashboard`, `attendance`, `analytics`, `providers`, `command-search` |
| `DEMO_TIMETABLE` | `src/utils/demo-data.ts:93` | `dashboard`, `timetable`, `providers` |
| `DEMO_MARKS` | `src/utils/demo-data.ts:120` | `dashboard`, `marks`, `analytics`, `providers` |
| `DEMO_EXAMS` | `src/utils/demo-data.ts:135` | `dashboard`, `exams`, `calendar`, `providers`, `command-search` |
| `DEMO_ASSIGNMENTS` | `src/utils/demo-data.ts:143` | `dashboard`, `assignments`, `calendar`, `providers`, `command-search` |
| `DEMO_EVENTS` | `src/utils/demo-data.ts:151` | `calendar` |
| `DEMO_CAMPUS_EVENTS` | `src/utils/demo-data.ts:159` | `dashboard`, `calendar`, `events`, `command-search` |
| `DEMO_CLUBS` | `src/utils/demo-data.ts:166` | `clubs`, `command-search` |
| `DEMO_MESS` | `src/utils/demo-data.ts:175` | `dashboard`, `mess` |
| `DEMO_NOTIFICATIONS` | `src/utils/demo-data.ts:186` | `notifications`, `notification-bell` |

**17 files** import from `demo-data.ts`.

---

## 3. Fictional Student Identity

- **Name:** Alex Kumar
- **Student ID:** RA2311003010001
- **Email:** alex.kumar@srm.edu.in
- **Phone:** +91 98765 43210
- **Program:** B.Tech Computer Science
- **Department:** Computer Science and Engineering
- **Year:** 2, **Semester:** 3

All purely fictional. Alex Kumar does not exist.

---

## 4. Desktop-Only Components

| Component | File | Issue |
|-----------|------|-------|
| Sidebar | `src/components/layout/sidebar.tsx:66` | `hidden lg:flex` — shows on desktop, hidden on mobile |
| App Shell | `src/components/layout/app-shell.tsx:24` | `lg:ml-64 pb-20 lg:pb-0` — desktop sidebar offset |
| Bottom Nav | `src/components/layout/bottom-nav.tsx:50` | `lg:hidden` — hidden on desktop |
| Dashboard | `src/app/(main)/dashboard/page.tsx:106` | `grid-cols-2 lg:grid-cols-4` — desktop 4-col grid |

---

## 5. Fake Sync

- `src/components/layout/app-shell.tsx:14-17` — `handleSync` uses `setTimeout` to simulate loading
- No actual server-side sync endpoint exists

---

## 6. Marketing Copy Issues

| Location | Current Copy | Issue |
|----------|-------------|-------|
| `src/app/(auth)/login/page.tsx:57` | "Everything about college. One dashboard." | Generic, not SRM-focused |
| `src/app/(main)/landing/page.tsx:30` | "College shouldn't need ten different apps." | Attacks competitors |
| `src/app/layout.tsx:19` | "CampusFlow — Everything about college. One dashboard." | Meta title |
| `public/manifest.json:4` | "Everything about college. One dashboard." | PWA description |
| Landing page features | "University Integration" | No real integration exists |

---

## 7. Missing Infrastructure

- No SRM API routes (`/api/srm/*`)
- No server-side session management
- No SRM parser/normalizer layer
- No encryption for stored session data
- No rate limiting
- No CAPTCHA handling
- No sync worker
- PWA icons (`icon-192.png`, `icon-512.png`) missing from `public/`

---

## 8. Environment Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_DEMO_MODE` | `true` (in .env.example) | Enables fake data |
| `NEXT_PUBLIC_DEFAULT_PROVIDER` | `manual` | Default provider |
| Supabase URL/Key | Not configured | Database only, not used for auth |

---

## Migration Plan

### Phase 1: Remove Fake Auth
- Replace localStorage auth with server-side SRM authentication
- Create `/api/srm/auth` endpoint
- Implement secure session cookies

### Phase 2: SRM Provider Architecture
- Create `src/server/srm/` directory
- Implement `AcademiaAdapter`, `StudentPortalAdapter`
- Create normalization layer
- Add session manager

### Phase 3-6: Real Data Integration
- Profile, attendance, marks, timetable parsers
- Normalization layer for SRM HTML responses

### Phase 7: Dashboard Migration
- Remove all DEMO_* imports from authenticated pages
- Build dashboard from synchronized data

### Phase 8: Real Sync
- Implement `/api/srm/sync` endpoint
- Add session expiry detection
- Add sync status UI

### Phase 9: Mobile-Only UI
- Remove desktop sidebar
- Center mobile canvas on large screens
- Keep bottom nav universally

### Phase 10: Brand Refresh
- New CampusFlow logo
- Updated PWA icons
- New marketing copy

### Phase 11: Security
- Audit credentials, sessions, cookies
- Add rate limiting
- Add security headers

### Phase 12: Testing
- Build verification
- Mobile responsive testing
- Dark/light mode testing
