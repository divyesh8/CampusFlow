-- SRM cumulative data must not be turned into invented daily attendance events.
ALTER TABLE profiles ADD COLUMN net_id text;
ALTER TABLE profiles ADD COLUMN batch text;
ALTER TABLE profiles ADD COLUMN last_synced_at timestamptz;
CREATE UNIQUE INDEX profiles_srm_identity ON profiles(university_id, student_id) WHERE net_id IS NOT NULL;

ALTER TABLE srm_sessions ADD COLUMN last_synced_at timestamptz;
ALTER TABLE srm_sessions ADD COLUMN srm_status text NOT NULL DEFAULT 'active'
  CHECK (srm_status IN ('active', 'expired'));

ALTER TABLE subjects ADD COLUMN srm_owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE subjects ADD COLUMN srm_key text;
ALTER TABLE subjects ADD COLUMN srm_faculty text;
ALTER TABLE subjects ADD COLUMN srm_slot text;
ALTER TABLE subjects ADD COLUMN srm_room text;
ALTER TABLE subjects ADD COLUMN srm_academic_year text;
ALTER TABLE subjects ALTER COLUMN credits TYPE numeric;
CREATE UNIQUE INDEX subjects_srm_key ON subjects(srm_owner_id, srm_key);

ALTER TABLE attendance_snapshots ADD COLUMN source text NOT NULL DEFAULT 'manual';
CREATE UNIQUE INDEX snapshots_srm_daily ON attendance_snapshots(user_id, subject_id, date) WHERE source = 'srm';
ALTER TABLE assessments ADD COLUMN srm_key text;
CREATE UNIQUE INDEX assessments_srm_key ON assessments(subject_id, srm_key);
ALTER TABLE assessments ALTER COLUMN type DROP NOT NULL;
ALTER TABLE assessments ALTER COLUMN weightage DROP NOT NULL;
ALTER TABLE assessments ALTER COLUMN max_marks TYPE numeric;
ALTER TABLE marks ALTER COLUMN marks_obtained TYPE numeric;
ALTER TABLE marks ALTER COLUMN marks_obtained DROP NOT NULL;
ALTER TABLE marks ALTER COLUMN max_marks TYPE numeric;
ALTER TABLE marks ADD COLUMN absent boolean NOT NULL DEFAULT false;

-- The latest successful component points to existing normalized records.
-- Failed components keep their previous record IDs and success timestamp.
CREATE TABLE srm_sync_components (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  component text NOT NULL CHECK (component IN ('profile', 'attendance', 'marks', 'courses')),
  record_ids uuid[] NOT NULL DEFAULT '{}',
  last_synced_at timestamptz,
  last_error text,
  PRIMARY KEY (user_id, component)
);
ALTER TABLE srm_sync_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_srm_components ON srm_sync_components FOR SELECT USING (auth.uid() = user_id);
ALTER TABLE sync_logs ADD COLUMN details jsonb NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX one_active_srm_sync ON sync_logs(user_id) WHERE provider = 'srm' AND status = 'syncing';

INSERT INTO universities(name, short_name, provider)
VALUES ('SRM Institute of Science and Technology', 'SRM', 'srm')
ON CONFLICT (short_name) DO NOTHING;

CREATE FUNCTION begin_srm_sync(p_user_id uuid) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  UPDATE sync_logs SET status = 'failed', completed_at = now(), error_message = 'SYNC_INTERRUPTED'
    WHERE user_id = p_user_id AND provider = 'srm' AND status = 'syncing' AND started_at < now() - interval '2 minutes';
  IF EXISTS (SELECT 1 FROM sync_logs WHERE user_id = p_user_id AND provider = 'srm' AND status = 'syncing') THEN
    RETURN NULL;
  END IF;
  INSERT INTO sync_logs(user_id, provider, status) VALUES(p_user_id, 'srm', 'syncing') RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE FUNCTION persist_srm_component(p_user_id uuid, p_component text, p_data jsonb)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_profile profiles; v_row jsonb; v_subject uuid; v_assessment uuid; v_record uuid;
  v_ids uuid[] := '{}'; v_code text; v_name text;
BEGIN
  SELECT * INTO STRICT v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF p_component = 'profile' THEN
    IF p_data->>'regNumber' IS DISTINCT FROM v_profile.student_id OR nullif(p_data->>'name','') IS NULL THEN
      RAISE EXCEPTION 'SRM_IDENTITY_MISMATCH';
    END IF;
    UPDATE profiles SET name = p_data->>'name', program = p_data->>'program', department = p_data->>'department',
      semester = (p_data->>'semester')::integer, section = p_data->>'section', batch = p_data->>'batch',
      phone = p_data->>'mobile', last_synced_at = now() WHERE id = p_user_id;
    v_ids := ARRAY[p_user_id];
  ELSE
    IF p_component NOT IN ('attendance', 'marks', 'courses') OR jsonb_typeof(p_data) <> 'array' THEN
      RAISE EXCEPTION 'SRM_SCHEMA_CHANGED';
    END IF;
    IF v_profile.semester IS NULL THEN RAISE EXCEPTION 'SRM_TERM_UNAVAILABLE'; END IF;
    FOR v_row IN SELECT value FROM jsonb_array_elements(p_data) LOOP
      v_code := v_row->>'code';
      SELECT id, name INTO v_subject, v_name FROM subjects
        WHERE srm_owner_id = p_user_id AND srm_key = v_profile.semester::text || ':' || v_code;
      v_name := coalesce(nullif(v_row->>'name',''), v_name);
      IF nullif(v_code,'') IS NULL OR v_name IS NULL THEN RAISE EXCEPTION 'SRM_SCHEMA_CHANGED'; END IF;
      INSERT INTO subjects(name, code, university_id, semester, department, credits, srm_owner_id, srm_key)
        VALUES(v_name, v_code, v_profile.university_id, v_profile.semester, v_profile.department, NULL,
          p_user_id, v_profile.semester::text || ':' || v_code)
        ON CONFLICT(srm_owner_id, srm_key) DO UPDATE SET name = excluded.name
        RETURNING id INTO v_subject;
      IF p_component = 'attendance' THEN
        IF (v_row->>'attended')::integer < 0 OR (v_row->>'conducted')::integer < (v_row->>'attended')::integer THEN
          RAISE EXCEPTION 'SRM_SCHEMA_CHANGED';
        END IF;
        INSERT INTO attendance_snapshots(user_id, subject_id, date, attended, conducted, percentage, source)
          VALUES(p_user_id, v_subject, (now() AT TIME ZONE 'Asia/Kolkata')::date,
            (v_row->>'attended')::integer, (v_row->>'conducted')::integer,
            coalesce(round(100 * (v_row->>'attended')::numeric / nullif((v_row->>'conducted')::numeric,0),2),0), 'srm')
          ON CONFLICT(user_id, subject_id, date) WHERE source = 'srm'
          DO UPDATE SET attended = excluded.attended, conducted = excluded.conducted, percentage = excluded.percentage
          RETURNING id INTO v_record;
      ELSIF p_component = 'marks' THEN
        IF (v_row->>'total')::numeric <= 0 OR (v_row->>'scored')::numeric > (v_row->>'total')::numeric THEN
          RAISE EXCEPTION 'SRM_SCHEMA_CHANGED';
        END IF;
        INSERT INTO assessments(subject_id, name, type, max_marks, weightage, srm_key)
          VALUES(v_subject, v_row->>'assessment', NULL, (v_row->>'total')::numeric, NULL, v_row->>'assessment')
          ON CONFLICT(subject_id, srm_key) DO UPDATE SET max_marks = excluded.max_marks RETURNING id INTO v_assessment;
        INSERT INTO marks(user_id, subject_id, assessment_id, marks_obtained, max_marks, absent)
          VALUES(p_user_id, v_subject, v_assessment, (v_row->>'scored')::numeric,
            (v_row->>'total')::numeric, (v_row->>'absent')::boolean)
          ON CONFLICT(user_id, assessment_id) DO UPDATE SET marks_obtained = excluded.marks_obtained,
            max_marks = excluded.max_marks, absent = excluded.absent RETURNING id INTO v_record;
      ELSE
        UPDATE subjects SET credits = (v_row->>'credits')::numeric, srm_faculty = v_row->>'faculty',
          srm_slot = v_row->>'slot', srm_room = v_row->>'room', srm_academic_year = v_row->>'academicYear'
          WHERE id = v_subject;
        v_record := v_subject;
      END IF;
      v_ids := array_append(v_ids, v_record);
    END LOOP;
  END IF;
  INSERT INTO srm_sync_components(user_id, component, record_ids, last_synced_at)
    VALUES(p_user_id, p_component, v_ids, now()) ON CONFLICT(user_id, component)
    DO UPDATE SET record_ids = excluded.record_ids, last_synced_at = excluded.last_synced_at, last_error = NULL;
  RETURN cardinality(v_ids);
END $$;

-- Atomic fixed-window limiter shared by serverless instances. Keys are SHA-256 hashes.
CREATE TABLE srm_rate_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
ALTER TABLE srm_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION consume_srm_rate_limit(p_key text, p_limit integer, p_window integer)
RETURNS boolean LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  DELETE FROM srm_rate_limits WHERE expires_at < now();
  INSERT INTO srm_rate_limits(key, count, expires_at) VALUES(p_key, 1, now() + make_interval(secs => p_window))
    ON CONFLICT(key) DO UPDATE SET count = srm_rate_limits.count + 1 RETURNING count INTO v_count;
  RETURN v_count <= p_limit;
END $$;

REVOKE ALL ON FUNCTION begin_srm_sync(uuid), persist_srm_component(uuid,text,jsonb),
  consume_srm_rate_limit(text,integer,integer), cleanup_expired_srm_sessions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION begin_srm_sync(uuid), persist_srm_component(uuid,text,jsonb),
  consume_srm_rate_limit(text,integer,integer), cleanup_expired_srm_sessions() TO service_role;
REVOKE ALL ON srm_rate_limits, srm_sessions, srm_auth_challenges FROM anon, authenticated;

-- SRM subjects are student-specific; same-university membership must not expose them.
-- Restrictive policies compose with the existing broad university policies.
CREATE POLICY isolate_srm_subjects ON subjects AS RESTRICTIVE FOR ALL
  USING (srm_owner_id IS NULL OR srm_owner_id = auth.uid())
  WITH CHECK (srm_owner_id IS NULL);
CREATE POLICY isolate_srm_assessments ON assessments AS RESTRICTIVE FOR ALL
  USING (EXISTS (SELECT 1 FROM subjects s WHERE s.id = subject_id AND (s.srm_owner_id IS NULL OR s.srm_owner_id = auth.uid())))
  WITH CHECK (srm_key IS NULL);
