# CampusFlow

An independent, unofficial SRMIST student dashboard. CampusFlow is not affiliated
with or endorsed by SRMIST.

## Current connector

The active implementation is the **SRM Student Portal** at `sp.srmist.edu.in`,
using Next.js API routes and isolated Playwright Chromium contexts. The flow is
`POST /api/srm/session` → manual CAPTCHA → `POST /api/srm/login`.

Real public CAPTCHA retrieval has been verified locally. Real-account
authentication and authenticated academic pages have not been verified.
`scraper.ts` intentionally returns `PORTAL_CHANGED`; it does not fake academic data.

See [Render Free deployment and manual testing](RENDER_DEPLOYMENT.md).
Older Academia integration reports describe a retired architecture.

## Local setup

Use Node 22.12+ or 24 and npm:

```sh
npm ci
npx playwright install chromium
```

Copy `.env.example` to `.env.local`, then change `NODE_ENV=development`,
`PORT=3000` and `FRONTEND_ORIGIN=http://localhost:3000` before `npm run dev`.
Open [the login page](http://localhost:3000/login).

Do not put SRM credentials in environment files, commands, fixtures, or Git.
Enter them only in the login form and solve the official CAPTCHA manually.

## Render Free

Deploy the entire UI and API as one Docker Web Service with the Free plan.
Follow [the 16-step deployment guide](RENDER_DEPLOYMENT.md). Optional
`render.yaml` declares one free service; no database, worker or paid add-on.

The container installs only Chromium from the lockfile-pinned Playwright package,
runs as a non-root user, checks browser launch during its build, and starts Next
on `0.0.0.0:$PORT`. Defaults: two active/pending sessions and a ten-minute idle TTL.
Restarts and sleep lose sessions; reconnect with a fresh CAPTCHA.

`/health` returns only `{"status":"ok","service":"campusflow"}`, without
starting Chromium or contacting SRM. Health does not verify the connector.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:portal
```

The last command needs the local server and network access. It loads one real
CAPTCHA without submitting credentials and then destroys its session.

## Legacy boundaries

The unused Academia authentication, network, environment, encryption and session
chain has been removed. Retired auth routes return 410 to help identify stale
clients. Pure Academia data types/parsers and historical persistence tests remain,
along with existing general repositories and migrations; none is used by the
current login. Architecture tests enforce this separation.

No dashboard, attendance, marks, timetable or unrelated page redesign is part of
the current authentication work.
