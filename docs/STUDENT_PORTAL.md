# Student Portal connector — 2026-10-04

## Current status

**Partial implementation; not a verified end-to-end integration.** Real CAPTCHA
retrieval from the official Student Portal works locally through CampusFlow.
No real student credentials were supplied or tested. The authenticated page DOM,
identity marker, navigation, profile and attendance tables remain uninspected.
`src/server/student-portal/scraper.ts` deliberately returns `PORTAL_CHANGED` (501)
until that evidence exists. Therefore a successful dashboard connection is not
currently possible. Do not represent this build as a completed academic connector.

The public login was inspected at:
https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp

Observed form: `#login_form`, POST `/srmiststudentportal/LoginServlet`, fields
`#username` (6-character maximum), `#password`, `#captcha` (8-character maximum),
image `#secure_captcha`, submit `#btnLogin`. Chromium loaded the real 175×45 image.
The portal's own scripts execute normally. CAPTCHA contents, hidden tokens and
fingerprints are not extracted, solved, modified or replayed separately.

## Repository audit and implementation choice

Existing stack: npm lockfile, Next.js 16.3.4 App Router, React 19, TypeScript,
Tailwind 4, shared UI components and an existing Next API backend. The mobile
shell, dashboard, profile, attendance and marks already use `useAuth` and
`useSrmData`; those interfaces are retained for academic rendering. Unrelated
pages and styling remain in place. Demo data is not wired into the new connector.

Next.js and its ESLint configuration were patched to 16.3.8 after npm audit
identified [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j).
This app does not use the affected ImageResponse path. The shadcn generator is
now a development dependency and is excluded from the production image.

The old integration targets **Academia/Zoho**, not the requested Student Portal.
It persists sessions and academic rows through Supabase. Its code and migrations
are retained as historical work; its public auth/debug/CAPTCHA routes now return
410. The active connector uses no Supabase database or keys. Older integration
reports and deployment instructions are superseded by this document.

Next already provides the required Node backend, so adding Express or a second
service would duplicate it. Railway runs the UI and API in one long-lived process.

## API

| Method | Route | Status |
| --- | --- | --- |
| POST | `/api/srm/session` | Creates isolated context, returns `{ sessionId, captcha }`, sets httpOnly cookie |
| POST | `/api/srm/login` | Validates `{ sessionId, netId, password, captcha }`; submits the same context's official form; authenticated adapter still blocked |
| GET | `/api/srm/session` | Returns verified profile if authenticated; otherwise 401 |
| DELETE | `/api/srm/session` | Closes context, removes all its data and clears cookie |
| GET | `/api/srm/data` | Existing UI's normalized academic contract; gated until verified authentication |
| POST | `/api/srm/sync` | Gated adapter invocation; never reports a successful empty scrape |
| GET | `/health`, `/api/health` | Minimal 200 liveness response, not proof of SRM availability |

## Security and operating limits

- Cryptographically random 256-bit session IDs; both body ID and httpOnly cookie
  required for login. Rotate ID after verified authentication. No localStorage.
- Separate incognito BrowserContext per student; credentials only sent through
  the official HTTPS portal origin. Other origins and popups are blocked.
- No password, CAPTCHA, cookie, request body, authenticated HTML, trace, HAR,
  video or browser console logging. No persistent browser profiles. Plaintext
  references are cleared as soon as filled/submitted. JavaScript cannot promise
  cryptographic erasure of immutable strings or browser-internal memory.
- Server memory only; inactivity TTL is configurable between 10 and 15 minutes,
  cleanup runs every 30 seconds. Logout/errors close contexts; process termination
  attempts cleanup. Restarts lose every session. Eight active/pending contexts max.
- Strict production HTTPS `FRONTEND_ORIGIN`, exact Origin checks for mutations,
  same-site strict, secure production cookies. The UI and API must share one origin;
  cross-site deployment is intentionally unsupported. No wildcard CORS.
- Existing Next headers provide HSTS, frame, MIME, referrer and permissions
  protection. Inputs use strict Zod validation and a 4 KiB JSON limit.
- Per-account hashed rate limits and conservative process-wide operation limits.
  Forwarded IP headers are not trusted. Limits are per process and reset on restart.
- No CAPTCHA solving, stealth evasion, automatic credential retry or third-party
  credential delivery. Production image runs as `pwuser`; Chromium's Playwright
  defaults still apply, including its default sandbox setting. Only the official
  portal origin is allowed; this service is not a general-purpose browser proxy.

## Local use

1. `npm ci` and `npx playwright install chromium`.
2. Copy `.env.example` to `.env.local` if needed, using only public configuration.
   `FRONTEND_ORIGIN=http://localhost:3000` must match the browser address exactly.
3. `npm run dev`; open http://localhost:3000/login.
4. `npm run test:portal` checks the public CAPTCHA flow without credentials.

Never put SRM credentials in configuration, a command, a fixture, Git or chat.
The old command-line credential diagnostic is retired.

## Railway deployment

1. Connect this repository to one Railway service, root directory `/`.
2. Use the root Dockerfile (also selected in `railway.json`). Image and npm
   Playwright versions are both pinned to 1.58.2. No secrets enter the build.
3. Generate a Railway HTTPS domain, then set `FRONTEND_ORIGIN` to its exact origin
   with no trailing slash. Set `NODE_ENV=production`, `SESSION_TTL_MINUTES=15`.
   Railway supplies `PORT`; the server binds it on `0.0.0.0`.
4. Keep **one replica**, no application sleep, and health check `/health`. Allow
   enough memory for Chromium (start with 1 GiB and measure before increasing
   the eight-session cap). No volume, database, Redis or credential variables.
5. Deploy and verify the CAPTCHA flow. This is deployment preparation only:
   Docker daemon was unavailable locally; neither image execution nor Railway
   deployment has been verified. Do not announce academic sync until implemented.

References: [Playwright Docker](https://playwright.dev/docs/docker) and
[Railway Dockerfiles](https://docs.railway.com/builds/dockerfiles).

## Verification and remaining work

- Production Next build, TypeScript, ESLint and 77 Vitest tests passed locally.
- Production server started locally on port 3100: `/health` and `/login` returned
  200, and session creation correctly refused missing HTTPS origin configuration.
- Production dependency audit reports zero vulnerabilities after patching Next
  and the transitive Undici dependency. Full audit still reports 12 development
  tooling advisories (2 moderate, 10 high); broad/major tooling upgrades were
  deferred. Development tooling is pruned from the Docker runtime.
- New unit tests cover isolated contexts, expiry, idle renewal, rotation,
  concurrent-operation exclusion, capacity reservations, input validation,
  origin rejection, safe errors and rate-limit expiry. Synthetic login tests verify
  password-reference clearing, context reuse and failure at the unverified adapter;
  these are not evidence of real authentication.
- Live public API checks passed: health, official CAPTCHA image, httpOnly cookie,
  no-store responses, pending-session access rejection, invalid payload rejection,
  foreign-origin rejection, disconnect and deleted-session rejection.
- A browser UI check confirmed the login page loads the real CAPTCHA and shows
  the form without client exceptions. Initial controls stay disabled until the
  session check completes, preventing clicks before hydration is ready.
- Four existing date-dependent tests failed at the current date/time. Their
  clocks are now fixed and the attendance assertions check exact output.
- Real login, invalid credential/CAPTCHA messages, authenticated DOM, normalized
  profile/attendance, marks, dashboard data and Railway remain unverified.
- Implement the verified adapter before connecting students. Do not reuse the
  Academia URLs/parsers as if they described the Student Portal. Add small redacted
  fixtures only after actual headings and navigation have been inspected.
- Marks and timetable remain secondary; do not infer a timetable from course count.

**One manual step:** At http://localhost:3000/login, load a CAPTCHA and submit your
own NetID/password/manual CAPTCHA answer once, then report only the displayed
CampusFlow status/error (never your credentials or CAPTCHA). An unsupported-page
message is expected if submission gets past the login form; it does not yet prove
authenticated academic access. The context is closed on that error.

## File manifest

Created:

- `.dockerignore`
- `.env.example`
- `Dockerfile`
- `docs/STUDENT_PORTAL.md`
- `railway.json`
- `scripts/check-student-portal.mjs`
- `src/app/api/srm/login/route.ts`
- `src/app/health/route.ts`
- `src/server/student-portal/auth.test.ts`
- `src/server/student-portal/auth.ts`
- `src/server/student-portal/browser.ts`
- `src/server/student-portal/config.ts`
- `src/server/student-portal/errors.ts`
- `src/server/student-portal/scraper.ts`
- `src/server/student-portal/security.test.ts`
- `src/server/student-portal/security.ts`
- `src/server/student-portal/session-manager.test.ts`
- `src/server/student-portal/session-manager.ts`

Modified:

- `.gitignore`
- `README.md`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `scripts/debug-srm-auth.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(main)/dashboard/page.tsx`
- `src/app/(main)/profile/page.tsx`
- `src/app/api/health/route.ts`
- `src/app/api/srm/auth/captcha/[challengeId]/route.ts`
- `src/app/api/srm/auth/route.ts`
- `src/app/api/srm/auth/verify/route.ts`
- `src/app/api/srm/data/route.ts`
- `src/app/api/srm/debug/route.ts`
- `src/app/api/srm/session/route.ts`
- `src/app/api/srm/sync/route.ts`
- `src/hooks/use-auth.ts`
- `src/hooks/use-srm-data.ts`
- `src/proxy.ts`
- `src/utils/calculations.test.ts`
