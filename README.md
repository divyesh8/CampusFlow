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

See [current deployment diagnosis and manual testing](docs/PORTAL_DIAGNOSIS.md).
Older Academia integration reports describe a retired architecture.

## Local setup

Use Node 22.12+ or 24 and npm:

```sh
npm ci
npx playwright install chromium
```

Copy `.env.example` to `.env.local`, keeping
`FRONTEND_ORIGIN=http://localhost:3000`, then run `npm run dev`.
Open [the login page](http://localhost:3000/login).

Do not put SRM credentials in environment files, commands, fixtures, or Git.
Enter them only in the login form and solve the official CAPTCHA manually.

## Railway

Deploy the root Dockerfile with one replica. It uses the official Playwright image
matching the pinned npm package, runs as `pwuser`, checks Chromium can launch in
the runtime image, and starts Next on `0.0.0.0:$PORT`.

Set runtime variables:

```dotenv
NODE_ENV=production
FRONTEND_ORIGIN=https://<actual-public-campusflow-origin>
SESSION_TTL_MINUTES=15
```

Railway supplies `PORT`. The UI and API must share the configured HTTPS origin.
No Supabase credentials, encryption keys, database, or persistent disk are required
for this connector. Browser contexts expire after inactivity and all sessions are
lost on process restart. Do not scale this implementation across replicas or
stateless functions.

`/health` returns liveness, the current connector identifier, origin configuration
status, and a commit SHA when supplied by the hosting platform. It is not proof of
SRM availability or Chromium readiness. No hosting provider is automatically changed.

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
