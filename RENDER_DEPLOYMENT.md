# CampusFlow on Render Free

## Scope and architecture

One Docker Web Service serves the Next.js UI and its relative `/api/srm/*` routes
on the same HTTPS origin. One shared Chromium process has isolated, temporary
BrowserContexts for each student. Default capacity is **two active or pending
sessions**, with **ten minutes of inactivity** before expiry. There is no worker,
database, Redis, Supabase requirement, persistent disk or paid API in this path.

The old live Vercel endpoint returned CONFIGURATION_ERROR before browser launch:
FRONTEND_ORIGIN was missing or invalid. This process-local session design also
needs one long-lived process. The previous hosting configuration is replaced by
Render; no remote service has been migrated by these repository edits.

## Exact manual deployment steps

1. Commit and push the prepared repository to `divyesh8/CampusFlow` on GitHub.
2. Open the [Render dashboard](https://dashboard.render.com/).
3. Choose **New → Web Service**.
4. Connect the CampusFlow GitHub repository and select the branch containing
   these changes. Leave the root directory at the repository root.
5. Select **Docker** runtime, Dockerfile `./Dockerfile`, context `.`. Keep Docker
   Command empty so the image starts Next itself. Set health check path `/health`.
6. Select **Free** instance type. If Free is unavailable, stop; do not select a
   paid fallback. Use a free workspace, no paid add-ons, and no payment method
   for this zero-cost MVP. Do not create databases, disks or additional services.
7. Deploy. The Dockerfile sets NODE_ENV=production; NEXT_PUBLIC_APP_NAME may be
   set to CampusFlow. The first deployment can be healthy without FRONTEND_ORIGIN;
   authentication requests safely refuse to run until it is configured.
8. Copy the generated HTTPS Render URL from the service page.
9. In **Environment**, set FRONTEND_ORIGIN to that exact HTTPS origin, without
   a trailing slash, `/login`, query or fragment. Do not use the SRM portal URL.
10. Set SESSION_TTL_MINUTES to `10`.
11. Set MAX_ACTIVE_SESSIONS to `2`.
12. Save the environment changes and redeploy. Leave PORT unset in the dashboard;
    Render supplies it. Keep one service/instance and the Free plan.
13. Visit `/health` on the generated origin. Expect HTTP 200 and exactly
    `{"status":"ok","service":"campusflow"}`. This does not test Chromium or SRM.
14. Open `/login` on that same Render origin. Allow the normal cold start to finish.
15. Click **Load SRM CAPTCHA** once and wait for the connector.
16. Confirm a real SRM CAPTCHA image and the NetID/password/manual CAPTCHA form
    appear. Do not enter credentials into Render settings or share the CAPTCHA.

The optional `render.yaml` declares the same **single Free Docker service**. Use
either manual creation or a Blueprint, not both. Blueprint creation prompts for
FRONTEND_ORIGIN; use the chosen service's actual origin and verify it after
creation. Production-specific values belong in Environment settings.

## Configuration

| Variable | Production value |
| --- | --- |
| NODE_ENV | `production` (also set in the image) |
| FRONTEND_ORIGIN | Exact generated HTTPS origin, no trailing slash |
| SESSION_TTL_MINUTES | `10`; supported range 10–15, clamped |
| MAX_ACTIVE_SESSIONS | `2`; validated whole number 1–8, keep 2 or lower on Free |
| NEXT_PUBLIC_APP_NAME | `CampusFlow` (non-secret display configuration) |
| PORT | Injected by Render; `10000` in `.env.example` is only a local example |

Do not configure SRM usernames/passwords, SRM_SESSION_KEY or Supabase credentials.
For local development only, change the example to NODE_ENV=development, PORT=3000,
FRONTEND_ORIGIN=http://localhost:3000 before running `npm run dev`.

## Container and memory behavior

The official Node 22 Debian Bookworm slim image follows Playwright's documented
custom-image approach. The complete Playwright image includes unused browser
engines; this Dockerfile instead runs the **lockfile-pinned Playwright 1.58.2 CLI**
to install its matching Chromium plus Linux dependencies. Firefox/WebKit are not
installed. The runtime prunes development packages, uses the non-root `node` user,
and includes Tini for child reaping/shutdown signals. A build step actually
launches and closes headless Chromium as that user. No extra Chromium flags,
recording, tracing, HAR, persistent profiles or CAPTCHA solving are added.

Next listens on `0.0.0.0:$PORT` (10000 fallback only for local container tests).
The shared browser is lazy; `/health` does not import or launch it. Active and
in-progress context creation both count toward capacity. Full capacity returns
SERVER_BUSY/503 before opening another context. Failure, logout and idle expiry
close contexts; expiry cleanup runs every 30 seconds and on session access.
Shutdown and browser disconnection clean up the session store.

Two contexts are a conservative cap, **not a measured memory guarantee**. If Free
runs out of memory, use MAX_ACTIVE_SESSIONS=1 and retest; do not upgrade to paid
infrastructure or hide the failure. The deployed memory load still needs testing.

## Free plan behavior and cost boundary

Render Free sleeps after 15 minutes without inbound traffic; waking typically
takes about a minute. Restarts and sleep lose all in-memory sessions. A stale
cookie returns SESSION_EXPIRED/401: the client clears authenticated state and
returns to login for a fresh CAPTCHA. Normal sleep is accepted; no self-pings,
cron jobs or uptime bots are installed.

Free hours are shared across the workspace (750/month). Bandwidth and build
allowances also apply. With no payment method, exceeding those allowances causes
suspension or disabled builds instead of supplementary billing. Do not add paid
services or upgrade if a free limit is reached. See [Render's free-service limits](https://render.com/docs/free).

## Verification and safe manual login

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
Build the Linux image with `docker build -t campusflow-render .`; the built-in
Chromium launch check must pass. A Docker daemon is required for this check.
For a credential-free local smoke test, run the development server and then
`npm run test:portal`. It creates one real public CAPTCHA session, checks cookies,
origin rejection and access controls, then disconnects. Never put credentials in
commands, fixtures, environment variables, logs or chat.

On Render, after CAPTCHA loads, privately enter your own NetID/password and solve
the CAPTCHA manually in the form. Submit once. Capture only the displayed safe
code, HTTP status and requestId if troubleshooting is necessary. Never share
network exports, cookie values, authorization headers, CAPTCHA answers or page HTML.

| Code | Action |
| --- | --- |
| CONFIGURATION_ERROR | Check exact FRONTEND_ORIGIN, valid MAX_ACTIVE_SESSIONS and image browser installation |
| PORTAL_UNAVAILABLE | Portal navigation, network or browser failed; try later |
| CAPTCHA_LOAD_FAILED | Image did not load/capture; request a fresh CAPTCHA |
| INVALID_CAPTCHA | Enter a fresh CAPTCHA manually |
| INVALID_CREDENTIALS | Check details privately; load a fresh CAPTCHA |
| SESSION_EXPIRED | Reconnect after expiry/restart/sleep |
| SERVER_BUSY | Wait for one of the limited session slots |
| PORTAL_CHANGED | Unexpected portal structure or intentional academic adapter boundary |
| INTERNAL_ERROR | Unexpected application failure; report only requestId/code |

Diagnostics contain only generated requestId, fixed stage, elapsed duration,
HTTP status and safe error code. Lifecycle creation/destruction is logged without
session IDs. Cookies stay httpOnly, Secure in production, SameSite=strict, path `/`.

## Authenticated scraper boundary and next evidence

`syncAcademicData()` still returns PORTAL_CHANGED/501 intentionally. No authenticated
URLs/selectors have been guessed. CAPTCHA retrieval, form submission and verified
authentication are separate milestones. A redirect or missing login form alone
does not prove authentication. Today's stub never grants an authenticated
CampusFlow session; real login must be tested manually before claiming success.

If authenticated state is independently confirmed, the remaining status is:
**Authentication infrastructure is working. Academic scraping requires
authenticated portal DOM inspection.** This statement is conditional, not a
claim that authentication has already been verified.

For the next phase, inspect the official portal after signing in yourself. Needed
evidence: redacted signed-in/sign-out markers, navigation labels, profile field
labels, attendance column headings, frame boundaries and sanitized page paths
(no query strings/fragments). Remove all personal values. No passwords, CAPTCHA,
cookies, tokens, storage-state files, HARs or raw authenticated HTML in chat.

## Local verification record — 2026-10-04

Type checking, ESLint, unit/integration tests and the production Next build passed.
The live local public CAPTCHA smoke test passed all checks, including real image
retrieval, cookie protections, origin/input rejection and session cleanup. No
credentials were used and no real authentication was claimed.

Docker Desktop start was attempted, followed by `docker build`. The local Linux
engine returned HTTP 500 on `/_ping` before the image build could start. Therefore
the Docker image build and Linux Chromium launch remain **unverified**. Fix/start
the local Docker engine and rerun the build, or inspect the first Render build's
embedded launch check. No Render deployment or Free memory-load test was executed.

References: [Render Docker](https://render.com/docs/docker),
[Blueprint fields](https://render.com/docs/blueprint-spec),
[Playwright Docker/custom images](https://playwright.dev/docs/docker).
