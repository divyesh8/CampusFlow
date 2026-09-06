# Core integration audit — 2026-09-06

## Architecture before this session

- Next 16 App Router; client auth context reads `/api/srm/session`. Middleware accepts either Supabase Auth or the presence of `cf_session`; API handlers must verify the latter in the database.
- Login posts to Academia's Zoho endpoint, follows OAuth redirects, decodes My_Attendance, then parses a profile. CAPTCHA verification duplicates profile creation and loses freshly issued cookies.
- AES-256-GCM encrypts cookies/profile in `srm_sessions`; browser receives an opaque httpOnly token, stored hashed in Supabase. `last_used_at` incorrectly masquerades as last successful sync.
- Sync fetches attendance twice (attendance + marks), guesses a timetable page, returns arrays and discards them. Parser failures are reported as successful syncs.
- Existing repositories require Supabase Auth UUIDs. SRM login produces `user-${netId}` strings, so those two paths cannot connect.
- Migrations 001/002 define 25 academic tables/RLS; 003 adds two service-only session/challenge tables. Attendance records are dated events; attendance snapshots hold aggregate counters.
- Profile reads the encrypted session copy; attendance, marks and timetable are pending placeholders. Dashboard has unavailable metrics. `src/utils/demo-data.ts` has no production imports. The unused provider returns empty arrays.
- No hosting configuration or Vercel verification evidence exists. Existing docs claiming viability are not live-account proof.

## Environment evidence

All four required Supabase/session variables are empty or absent in `.env.local` and the current process. No SRM test credentials are configured. Applied migrations cannot be inspected without a database connection. Never commit environment values or real student HTML.

## Source limits

The public Academia landing page and sign-in iframe are reachable through the research browser. This proves only public reachability, not local Node outbound access or authenticated requests. Authenticated page fixtures and real login remain required. Existing course output contains slot labels; it does not establish a weekday/time mapping. Do not synthesize one.
