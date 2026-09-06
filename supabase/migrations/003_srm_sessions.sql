-- CampusFlow SRM Session & CAPTCHA Persistence
-- Replaces in-memory Map stores with persistent Supabase tables

-- ============================================================
-- SRM SESSIONS - Persistent session storage for Vercel serverless
-- ============================================================
CREATE TABLE srm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token_hash TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  net_id TEXT NOT NULL,
  email TEXT NOT NULL,
  encrypted_srm_state TEXT NOT NULL,
  encrypted_profile TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_srm_sessions_token_hash ON srm_sessions (session_token_hash);
CREATE INDEX idx_srm_sessions_net_id ON srm_sessions (net_id);
CREATE INDEX idx_srm_sessions_expires_at ON srm_sessions (expires_at);

-- ============================================================
-- SRM AUTH CHALLENGES - Persistent CAPTCHA challenge storage
-- ============================================================
CREATE TABLE srm_auth_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_token_hash TEXT UNIQUE NOT NULL,
  net_id TEXT NOT NULL,
  encrypted_cookie_state TEXT NOT NULL,
  captcha_digest TEXT NOT NULL,
  captcha_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_srm_auth_challenges_token_hash ON srm_auth_challenges (challenge_token_hash);
CREATE INDEX idx_srm_auth_challenges_expires_at ON srm_auth_challenges (expires_at);

-- ============================================================
-- CLEANUP FUNCTION - Remove expired records
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_srm_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM srm_sessions WHERE expires_at < now();
  DELETE FROM srm_auth_challenges WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RLS POLICIES - Admin-only access (service role bypasses RLS)
-- ============================================================
ALTER TABLE srm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE srm_auth_challenges ENABLE ROW LEVEL SECURITY;

-- No user-level policies needed; only service role accesses these tables
-- RLS is enabled as defense-in-depth
CREATE POLICY "Service role only access on srm_sessions"
  ON srm_sessions FOR ALL
  USING (false);

CREATE POLICY "Service role only access on srm_auth_challenges"
  ON srm_auth_challenges FOR ALL
  USING (false);
