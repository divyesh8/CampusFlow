# SRM_INTEGRATION_REPORT.md

## CampusFlow SRM Integration Status Report

**Date:** September 2, 2026
**Version:** 0.2.0

---

## Integration Status: IN PROGRESS — Authentication Pipeline Fixed

The SRM integration has been restructured to properly handle OAuth redirects,
concurrent sessions, CAPTCHA challenges, and page decoding. The authentication
pipeline now follows best practices for server-side web scraping of SRM Academia.

**Current status:**
- Authentication: IMPLEMENTED — NOT VERIFIED
- Profile parser: IMPLEMENTED — NOT VERIFIED
- Attendance parser: IMPLEMENTED — NOT VERIFIED
- Marks parser: IMPLEMENTED — NOT VERIFIED
- Timetable parser: IMPLEMENTED — NOT VERIFIED
- Dashboard greeting: IMPLEMENTED — NOT VERIFIED

**What has been verified:**
- Code compiles and builds without errors
- TypeScript types are correct
- All parsers are structurally complete

**What needs verification:**
- Testing with real student credentials against live SRM servers
- CAPTCHA handling validation
- Parser accuracy verification with actual portal responses
- OAuth redirect chain completion
- Session cookie establishment

---

## Changes in v0.2.0

### Critical Fixes
1. **Unbounded recursion fix**: Concurrent session retry now limited to 2 attempts
2. **Manual redirect following**: OAuth redirects now preserve cookies across hops
3. **Session verification**: Login succeeds only after verified authenticated page fetch
4. **Stage-level diagnostics**: Every authentication stage is timed and logged
5. **Deterministic timeouts**: Per-request (12s) and overall (30s) timeouts enforced
6. **Page decoding**: `.sanitize()` hex-escaped responses are decoded before parsing
7. **CAPTCHA state**: Server-side challenge storage, proxy for CAPTCHA images
8. **Session manager**: Opaque browser cookies with server-side session store
9. **AES-256-GCM**: Authenticated encryption instead of unauthenticated AES-CBC
10. **Frontend timeout**: AbortController with 35s timeout prevents infinite spinner

### Architecture
```
Browser
  → POST /api/srm/auth { netId, password }
  → Server: SRMLoginService.loginWithRetry()
    → POST signin.ac (12s timeout)
    → Handle concurrent session (max 2 retries)
    → Handle CAPTCHA (server-side challenge store)
    → Manual redirect chain (max 10 hops, cookies preserved)
    → Verify session via authenticated page fetch
    → Decode .sanitize() response
    → Parse student profile
  → Create session (opaque browser cookie, server-side store)
  → Return profile to dashboard
```

---

## Authentication Method

**Current:** Server-side HTTP requests to SRM Academia + server-side session store
**Flow:**
```
Mobile browser
  → POST /api/srm/auth { netId, password }
  → Server-side SRM HTTP client with manual redirect following
  → POST to academia.srmist.edu.in/accounts/signin.ac
  → Handle concurrent session (force logout, max 2 retries)
  → Handle CAPTCHA challenge (server-side challenge store)
  → Follow OAuth redirects with manual cookie management
  → Verify session by fetching authenticated page
  → Decode .sanitize() response if present
  → Parse student profile from decoded HTML
  → Create CampusFlow session (opaque ID in cookie, data server-side)
  → Dashboard with real student name
```

### Implemented Endpoints
- `POST /api/srm/auth` — Real SRM authentication with CAPTCHA support
- `POST /api/srm/auth/verify` — CAPTCHA verification continuation
- `GET /api/srm/auth/captcha/:challengeId` — CAPTCHA image proxy
- `GET /api/srm/session` — Session validation (returns safe profile data only)
- `DELETE /api/srm/session` — Session destruction
- `POST /api/srm/sync` — Real data synchronization (attendance, marks, courses)

### Security
- Opaque random session IDs (256-bit)
- AES-256-GCM encrypted session storage
- HttpOnly, Secure, SameSite=Lax cookies
- SRM cookies never sent to frontend
- Passwords never stored
- No localStorage authentication
- CAPTCHA challenges expire after 5 minutes

---

## Official SRM Domains Accessed

| Domain | Purpose | Status |
|--------|---------|--------|
| academia.srmist.edu.in | Login, attendance, marks, courses, timetable | IMPLEMENTED — NOT VERIFIED |

---

## Authentication Flow Details

### Login Endpoint
```
POST https://academia.srmist.edu.in/accounts/signin.ac
Content-Type: application/x-www-form-urlencoded

username={netId}@srmist.edu.in
password={password}
client_portal=true
portal=10002227248
servicename=ZohoCreator
serviceurl=https://academia.srmist.edu.in/
is_ajax=true
grant_type=password
service_language=en
```

### Response Handling
- **Success**: Returns `{ status: "success", data: { access_token, oauthorize_uri } }`
- **Captcha Required**: Returns `{ status: "fail", code: "HIP_REQUIRED", cdigest: "..." }`
- **Invalid Credentials**: Returns `{ error: { msg: "..." } }`
- **Concurrent Session**: Returns HTML with terminate form (max 2 retries)

### Session Establishment
1. Receive `access_token` and `oauthorize_uri` from login response
2. Follow OAuth redirect chain with manual cookie management (max 10 hops)
3. Verify session by fetching authenticated Academia page
4. Decode `.sanitize()` response if present
5. Parse student profile from decoded HTML

---

## Data Endpoints

| Page | URL | Parser |
|------|-----|--------|
| Attendance/Marks | `academia.srmist.edu.in/.../page/My_Attendance` | `attendance-parser.ts` |
| Courses/Timetable | `academia.srmist.edu.in/.../page/My_Time_Table_2023_24` | `course-parser.ts`, `profile-parser.ts` |

---

## Parser Strategy

All parsers use **semantic selectors** based on:
- Label text (e.g., "Name:", "Program:", "Department:")
- Table structure with stable attributes
- Known HTML patterns from SRM Academia
- Schema validation via TypeScript interfaces

Page decoding handles `.sanitize()` hex-escaped responses before parsing.

---

## Session Security

| Measure | Status |
|---------|--------|
| Opaque random session IDs | IMPLEMENTED (256-bit) |
| AES-256-GCM encrypted storage | IMPLEMENTED |
| HttpOnly cookies | IMPLEMENTED |
| Secure flag (production) | IMPLEMENTED |
| SameSite=Lax | IMPLEMENTED |
| No localStorage auth | IMPLEMENTED |
| No SRM password storage | IMPLEMENTED |
| SRM cookies server-side only | IMPLEMENTED |
| No credentials in logs | IMPLEMENTED |
| Session expiry (24h) | IMPLEMENTED |
| Session destruction on logout | IMPLEMENTED |

---

## Password Handling

- Password sent only during `/api/srm/auth` request
- Used for immediate SRM authentication only
- Discarded immediately after authentication attempt
- Never stored in database, localStorage, sessionStorage, logs, or analytics
- Not exposed to client-side JavaScript

---

## CAPTCHA Handling

When SRM requires CAPTCHA verification:
1. Server creates a temporary challenge (expires in 5 minutes)
2. CAPTCHA image proxied through `/api/srm/auth/captcha/:challengeId`
3. CampusFlow displays the CAPTCHA image to the student
4. Student manually enters the CAPTCHA text
5. CampusFlow submits to `/api/srm/auth/verify` with challenge ID
6. Authentication continues with the CAPTCHA solution

**Rule:** CampusFlow never automatically solves CAPTCHAs.

---

## Diagnostics

Every authentication request produces structured stage logs:
- `AUTH_REQUEST_START` — Beginning of authentication
- `SIGNIN_POST_START/COMPLETE` — SRM login endpoint
- `CONCURRENT_SESSION_DETECTED/TERMINATED` — Session conflict handling
- `OAUTH_REDIRECT_START/COMPLETE` — OAuth redirect chain
- `SESSION_VERIFY_START/COMPLETE` — Session verification
- `AUTH_COMPLETE` — Authentication finished

Each stage records: duration, HTTP status, cookie names, redirect host.

---

## Files Modified

| File | Change |
|------|--------|
| `src/server/srm/academia-config.ts` | Configuration and types |
| `src/server/srm/academia-client.ts` | Manual redirect following with cookie jar |
| `src/server/srm/login-service.ts` | Retry limits, diagnostics, timeouts, verification |
| `src/server/srm/academia-service.ts` | Page decoding before parsing |
| `src/server/srm/decode-academia-page.ts` | NEW — .sanitize() hex decoding |
| `src/server/srm/captcha-store.ts` | NEW — Server-side CAPTCHA challenge storage |
| `src/server/srm/session-manager.ts` | Opaque IDs, AES-256-GCM, server-side store |
| `src/server/srm/parsers/profile-parser.ts` | Student profile parser |
| `src/server/srm/parsers/attendance-parser.ts` | Attendance + marks parser |
| `src/server/srm/parsers/course-parser.ts` | Course/timetable parser |
| `src/app/api/srm/auth/route.ts` | CAPTCHA challenges, diagnostics, runtime config |
| `src/app/api/srm/auth/verify/route.ts` | NEW — CAPTCHA verification endpoint |
| `src/app/api/srm/auth/captcha/[challengeId]/route.ts` | NEW — CAPTCHA image proxy |
| `src/app/api/srm/session/route.ts` | Runtime config |
| `src/app/api/srm/sync/route.ts` | Runtime config |
| `src/hooks/use-auth.ts` | AbortController timeout (35s) |
| `src/app/(auth)/login/page.tsx` | ChallengeId handling, error display |
| `scripts/debug-srm-auth.ts` | Stage timing diagnostics |
| `SRM_INTEGRATION_REPORT.md` | Updated status |

---

## Testing

### Type Check
```bash
npm run typecheck
```

### Lint
```bash
npm run lint
```

### Diagnostic Script
```bash
SRM_TEST_NETID=your_netid SRM_TEST_PASSWORD=your_password npx tsx scripts/debug-srm-auth.ts
```

---

## Next Steps

1. **Test with real student credentials** against live SRM servers
2. **Verify OAuth redirect chain** completes successfully
3. **Validate CAPTCHA handling** works correctly
4. **Verify parser accuracy** with actual portal HTML
5. **Test on Vercel** — verify outbound requests reach SRM
6. If Vercel egress is blocked, move SRM worker to Railway/Render/Fly.io

---

## Known Limitations

1. **NOT YET VERIFIED** — All status claims are "IMPLEMENTED — NOT VERIFIED"
2. **CAPTCHA testing** — Needs validation against live SRM with actual CAPTCHA challenges
3. **Parser accuracy** — Parsers built from documented patterns, need verification with real HTML
4. **Session expiry** — SRM session lifetime not yet characterized
5. **Vercel egress** — SRM may block or delay serverless outbound IPs

---

## Status Language

```
Authentication: IMPLEMENTED — NOT VERIFIED
Profile parser: IMPLEMENTED — NOT VERIFIED
Attendance parser: IMPLEMENTED — NOT VERIFIED
Marks parser: IMPLEMENTED — NOT VERIFIED
Timetable parser: IMPLEMENTED — NOT VERIFIED
Calendar: NOT IMPLEMENTED
```

Until actual testing with a real authorized SRM student account confirms each feature,
the status remains IMPLEMENTED — NOT VERIFIED.
