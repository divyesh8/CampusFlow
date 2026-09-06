export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<Row> = { Row: { [K in keyof Row]: Row[K] }; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
export interface ProfileRow {
  id: string; university_id: string | null; campus_id: string | null; student_id: string | null;
  net_id: string | null; name: string; email: string; phone: string | null;
  program: string | null; department: string | null; year: number | null; semester: number | null;
  section: string | null; batch: string | null; attendance_threshold: number | null;
  avatar_url: string | null; onboarded: boolean; created_at: string; updated_at: string; last_synced_at: string | null;
}
export interface SessionRow {
  id: string; session_token_hash: string; user_id: string; net_id: string; email: string;
  encrypted_srm_state: string; encrypted_profile: string; created_at: string;
  last_used_at: string; expires_at: string; last_synced_at: string | null; srm_status: "active" | "expired";
}
export interface ChallengeRow {
  id: string; challenge_token_hash: string; net_id: string; encrypted_cookie_state: string;
  captcha_digest: string; captcha_url: string; created_at: string; expires_at: string;
}
export interface SubjectRow {
  id: string; name: string; code: string; university_id: string; semester: number;
  department: string | null; credits: number | null; srm_owner_id: string | null; srm_key: string | null;
  srm_faculty: string | null; srm_slot: string | null; srm_room: string | null; srm_academic_year: string | null;
}
export interface ComponentRow {
  user_id: string; component: string; record_ids: string[]; last_synced_at: string | null; last_error: string | null;
}
export interface Database {
  public: {
    Tables: {
      srm_sessions: Table<SessionRow>;
      srm_auth_challenges: Table<ChallengeRow>;
      profiles: Table<ProfileRow>;
      universities: Table<{ id: string; name: string; short_name: string; provider: string }>;
      subjects: Table<SubjectRow>;
      attendance_snapshots: Table<{ id: string; user_id: string; subject_id: string; date: string; attended: number; conducted: number; percentage: number; source: string }>;
      assessments: Table<{ id: string; subject_id: string; name: string; type: string | null; max_marks: number; weightage: number | null; srm_key: string | null }>;
      marks: Table<{ id: string; user_id: string; subject_id: string; assessment_id: string; marks_obtained: number | null; max_marks: number; absent: boolean }>;
      srm_sync_components: Table<ComponentRow>;
      sync_logs: Table<{ id: string; user_id: string; provider: string; status: string; records_updated: number; error_message: string | null; started_at: string; completed_at: string | null; details: Json }>;
    };
    Views: Record<string, never>;
    Functions: {
      cleanup_expired_srm_sessions: { Args: Record<string, never>; Returns: undefined };
      begin_srm_sync: { Args: { p_user_id: string }; Returns: string | null };
      persist_srm_component: { Args: { p_user_id: string; p_component: string; p_data: Json }; Returns: number };
      consume_srm_rate_limit: { Args: { p_key: string; p_limit: number; p_window: number }; Returns: boolean };
    };
  };
}

