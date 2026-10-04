# Student Portal login/deployment diagnosis — 2026-10-04

> Historical diagnosis. Current hosting configuration and verification are in
> [RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md).

## What was reproduced

The supplied production URL was https://campusflow-psi.vercel.app/login.
Credential-free requests to that deployment returned:

| Probe | Observed result before these changes |
| --- | --- |
| POST /api/srm/auth with empty JSON | 410 ENDPOINT_RETIRED |
| POST /api/srm/login with empty JSON and matching Origin | 503 CONFIGURATION_ERROR |
| GET /health and /api/health | 200 |
| Login HTML and downloaded client scripts | CAPTCHA-first UI, /api/srm/login present, no /api/srm/auth call |

Thus the currently observed deployment is using the Student Portal implementation,
not the old Academia login. Its **FRONTEND_ORIGIN is missing or rejected by the
current production validator**. The actual environment value was not accessible,
so missing versus malformed cannot be distinguished here. No hosting settings or
deployment were changed.

The exact quoted older message was NOT reproduced on that live deployment.
Its source was the legacy error mapping:

`old /api/srm/auth → guardAuth → rateLimit → getEnv → missing legacy
SRM_SESSION_KEY/Supabase variables → routeError → classifySRMError →
SERVER_CONFIG_ERROR → "CampusFlow's SRM connection is temporarily misconfigured."`

Commit `040814b` contains that old route. Before this task, the current route
already returned 410. The unused `src/providers/index.ts` still contained an old
auth call, but no application module imported that provider. No active Student
Portal route imported the legacy environment validator. A stale client/deployment
at the time of the original report is possible, but is not proven by current
evidence. Do not diagnose it as confirmed.

The current observed failure path is:

`login page/useAuth → POST /api/srm/login → guard → checkOrigin →
frontendOrigin → CONFIGURATION_ERROR (503)`

It occurs before body validation and before any SRM authentication attempt.

## Changes

- Removed the unused frontend provider and the dead Academia HTTP client,
  authentication/response, CAPTCHA store, encrypted session, profile/sync
  orchestration, request security and environment validation code.
- Removed the dead SRM persistence repository used only by that chain.
- Kept pure legacy data parsers/types/fixtures, migration tests and general
  repositories. The legacy config/error files now export only data types.
- Kept retired endpoint tombstones returning 410. They cannot accept credentials.
- Active origin validation reads only FRONTEND_ORIGIN, requires production HTTPS,
  rejects credentials, wildcard hosts, paths, queries and fragments, and safely
  normalizes whitespace and a root trailing slash. Mutation Origin must still
  exactly match the normalized configured origin; no wildcard CORS or fallback
  to an untrusted Host/forwarded header was added.
- Missing Chromium executable is a safe configuration failure. Runtime launch
  failure remains a portal-service failure; raw browser exceptions are not logged.
- Fixed same-URL login-return handling and stopped mapping network timeouts to
  invalid credentials. Only explicit rejection text is classified; ambiguous
  rejection stays LOGIN_FAILED. Actual SRM rejection variants remain unverified.
- Fixed cross-route error identity: the process-global session store may throw
  errors created by another Next bundle. A stable internal symbol preserves
  SESSION_EXPIRED as 401 instead of incorrectly returning PORTAL_UNAVAILABLE/502.
- Added safe request correlation and stage diagnostics, plus connector/config
  information on the health response.
- Added a Docker build step that launches/closes Chromium as the runtime user.

## Logs and interpretation

Records contain only generated requestId, fixed stage, duration, optional numeric
HTTP status and an allowlisted error code. They do not contain NetID, password,
CAPTCHA, cookies, headers, URLs, HTML, exception messages or portal page contents.
Request IDs are returned in failure JSON and the X-Request-ID response header.

Typical challenge sequence:

`PORTAL_REQUEST_START → PORTAL_CHALLENGE_START → PORTAL_BROWSER_START →
PORTAL_BROWSER_READY → PORTAL_PAGE_LOADED → PORTAL_CAPTCHA_READY`

Login submission:

`PORTAL_REQUEST_START → PORTAL_LOGIN_START → PORTAL_LOGIN_SUBMITTED →
PORTAL_LOGIN_REDIRECT → PORTAL_SYNC_UNIMPLEMENTED`

A redirect or an absent login form is NOT verified authentication. The current
adapter throws PORTAL_CHANGED/501, closes the context, and never grants a
CampusFlow authenticated session. PORTAL_AUTHENTICATED is emitted only after a
future verified adapter supplies both profile and academic data; it is unreachable
with today's stub.

A configuration error before PORTAL_BROWSER_START indicates origin configuration.
A configuration error after that stage indicates the Chromium executable is
missing. PORTAL_UNAVAILABLE covers transport/browser failures. An unrecognized
login-form rejection is LOGIN_FAILED, not a fabricated credential diagnosis.

## Hosting configuration

The current target is one Render Free Docker service serving UI and API.
See [RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md) for environment settings,
cold starts and the exact deployment steps. Earlier hosting instructions are superseded.

## Manual checks

1. Configure the intended service and deploy these changes. Open /health: expect
   status=ok and service=campusflow. It checks liveness only, not configuration.
2. Open /login on that same HTTPS origin and load one CAPTCHA. Confirm the official
   image is visible. Enter your account details privately and manually answer the
   CAPTCHA, then submit once.
3. If it fails, collect ONLY the HTTP status, safe error code, requestId, and
   matching structured stage records. Do not share full network exports, request
   bodies, cookies, credentials, CAPTCHA values or raw portal HTML.
4. PORTAL_CHANGED/501 with PORTAL_SYNC_UNIMPLEMENTED is the intentional remaining
   boundary. It is not a verified login/sync success. INVALID_CAPTCHA or
   INVALID_CREDENTIALS requires a fresh CAPTCHA; SESSION_EXPIRED requires reconnect.

## Next session evidence

After signing in directly to the official portal yourself, provide a redacted
view of the navigation labels, the profile field LABELS, attendance table COLUMN
HEADINGS, and the visible signed-in/sign-out indicator. Remove names, registration
numbers, account identifiers, scores and other personal values. If a page path is
needed, remove every query parameter/fragment/token first. Share no raw authenticated
HTML, cookie, storage-state file, HAR or password. Those structural observations
are needed before implementing identity verification and the academic adapter.

## Verification

TypeScript, lint, all 106 unit/integration tests, production build and the public
CAPTCHA/session smoke check passed locally. The smoke check exposed the
cross-bundle SESSION_EXPIRED classification bug, which was fixed and covered by
a regression test; the full smoke check then passed. No real student credentials
were used. The Docker engine is unavailable locally, so the Docker build/runtime
check and hosted deployment remained unexecuted at the time of that diagnosis. Authenticated scraping is
intentionally unfinished.


## Files changed

Created:

- `docs/PORTAL_DIAGNOSIS.md`
- `src/server/srm/README.md`
- `src/server/student-portal/architecture.test.ts`
- `src/server/student-portal/diagnostics.ts`
- `src/server/student-portal/routes.test.ts`

Modified:

- `.env.example`
- `Dockerfile`
- `README.md`
- `docs/STUDENT_PORTAL.md`
- `src/app/api/srm/login/route.ts`
- `src/app/api/srm/session/route.ts`
- `src/app/api/srm/sync/route.ts`
- `src/app/health/route.ts`
- `src/server/srm/academia-config.ts`
- `src/server/srm/error-codes.ts`
- `src/server/student-portal/auth.test.ts`
- `src/server/student-portal/auth.ts`
- `src/server/student-portal/browser.ts`
- `src/server/student-portal/config.ts`
- `src/server/student-portal/errors.ts`
- `src/server/student-portal/scraper.ts`
- `src/server/student-portal/security.test.ts`
- `src/server/student-portal/security.ts`

Removed after dependency analysis:

- `src/lib/repositories/srm-repository.ts`
- `src/providers/index.ts`
- `src/server/env.ts`
- `src/server/srm/academia-client.ts`
- `src/server/srm/academia-service.ts`
- `src/server/srm/auth-response.ts`
- `src/server/srm/captcha-store.ts`
- `src/server/srm/decode-academia-page.ts`
- `src/server/srm/encryption.ts`
- `src/server/srm/login-service.ts`
- `src/server/srm/profile-service.ts`
- `src/server/srm/request-security.ts`
- `src/server/srm/session-manager.ts`
- `src/server/srm/sync-service.ts`
