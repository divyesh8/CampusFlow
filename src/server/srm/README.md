# Historical Academia data utilities only

The Academia HTTP client, authentication, session persistence, encryption, error
response handlers, sync orchestration and legacy environment validator have been
removed. The unused frontend provider and its retired auth call were also removed.

This directory retains pure parsers, types, normalization and existing fixture/
migration tests. `profile-repository.ts` still uses the `NormalizedProfile` type;
database migrations and general repositories were not changed. None of this
directory is a dependency of the current Student Portal login routes.

Do not reuse these Academia schemas as Student Portal evidence. The active
connector is `src/server/student-portal/`. Its authenticated scraper remains
intentionally unimplemented.
