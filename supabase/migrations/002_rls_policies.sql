-- CampusFlow Row Level Security Policies
-- Ensures students can only access their own private data
-- Public data (campus events, clubs) has separate read policies

-- ============================================================
-- HELPER: Get current user ID
-- ============================================================
-- auth.uid() returns the current Supabase user's UUID

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- UNIVERSITIES (public read)
-- ============================================================
CREATE POLICY "Anyone can view universities"
  ON universities FOR SELECT
  USING (true);

-- ============================================================
-- CAMPUSES (public read)
-- ============================================================
CREATE POLICY "Anyone can view campuses"
  ON campuses FOR SELECT
  USING (true);

-- ============================================================
-- UNIVERSITY_CONNECTIONS
-- ============================================================
CREATE POLICY "Users can view own connections"
  ON university_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON university_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON university_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON university_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- ACADEMIC_YEARS (read for enrolled users)
-- ============================================================
CREATE POLICY "Users can view academic years for their university"
  ON academic_years FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.university_id = academic_years.university_id
    )
  );

-- ============================================================
-- SEMESTERS (read for enrolled users)
-- ============================================================
CREATE POLICY "Users can view semesters for their academic years"
  ON semesters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academic_years
      JOIN profiles ON profiles.university_id = academic_years.university_id
      WHERE profiles.id = auth.uid()
      AND academic_years.id = semesters.academic_year_id
    )
  );

-- ============================================================
-- SUBJECTS (read for enrolled users)
-- ============================================================
CREATE POLICY "Users can view subjects for their university"
  ON subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.university_id = subjects.university_id
    )
  );

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own enrollments"
  ON enrollments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- ATTENDANCE_RECORDS
-- ============================================================
CREATE POLICY "Users can view own attendance"
  ON attendance_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
  ON attendance_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance"
  ON attendance_records FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- ATTENDANCE_SNAPSHOTS
-- ============================================================
CREATE POLICY "Users can view own attendance snapshots"
  ON attendance_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance snapshots"
  ON attendance_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ASSESSMENTS (read for enrolled users)
-- ============================================================
CREATE POLICY "Users can view assessments for their subjects"
  ON assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.user_id = auth.uid()
      AND enrollments.subject_id = assessments.subject_id
    )
  );

-- ============================================================
-- MARKS
-- ============================================================
CREATE POLICY "Users can view own marks"
  ON marks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marks"
  ON marks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marks"
  ON marks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own marks"
  ON marks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TIMETABLES
-- ============================================================
CREATE POLICY "Users can view own timetables"
  ON timetables FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timetables"
  ON timetables FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timetables"
  ON timetables FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timetables"
  ON timetables FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TIMETABLE_ENTRIES
-- ============================================================
CREATE POLICY "Users can view own timetable entries"
  ON timetable_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM timetables
      WHERE timetables.id = timetable_entries.timetable_id
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own timetable entries"
  ON timetable_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timetables
      WHERE timetables.id = timetable_entries.timetable_id
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own timetable entries"
  ON timetable_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM timetables
      WHERE timetables.id = timetable_entries.timetable_id
      AND timetables.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timetables
      WHERE timetables.id = timetable_entries.timetable_id
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own timetable entries"
  ON timetable_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM timetables
      WHERE timetables.id = timetable_entries.timetable_id
      AND timetables.user_id = auth.uid()
    )
  );

-- ============================================================
-- TIMETABLE_OVERRIDES
-- ============================================================
CREATE POLICY "Users can view own timetable overrides"
  ON timetable_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM timetable_entries
      JOIN timetables ON timetables.id = timetable_entries.timetable_id
      WHERE timetable_entries.id = timetable_overrides.original_entry_id
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own timetable overrides"
  ON timetable_overrides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timetable_entries
      JOIN timetables ON timetables.id = timetable_entries.timetable_id
      WHERE timetable_entries.id = timetable_overrides.original_entry_id
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own timetable overrides"
  ON timetable_overrides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM timetable_entries
      JOIN timetables ON timetables.id = timetable_entries.timetable_id
      WHERE timetable_entries.id = timetable_overrides.original_entry_id
      AND timetables.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timetable_entries
      JOIN timetables ON timetables.id = timetable_entries.timetable_id
      WHERE timetable_entries.id = timetable_overrides.original_entry_id
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own timetable overrides"
  ON timetable_overrides FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM timetable_entries
      JOIN timetables ON timetables.id = timetable_entries.timetable_id
      WHERE timetable_entries.id = timetable_overrides.original_entry_id
      AND timetables.user_id = auth.uid()
    )
  );

-- ============================================================
-- ACADEMIC_EVENTS
-- ============================================================
CREATE POLICY "Users can view own academic events"
  ON academic_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own academic events"
  ON academic_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own academic events"
  ON academic_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own academic events"
  ON academic_events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- EXAMS
-- ============================================================
CREATE POLICY "Users can view own exams"
  ON exams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exams"
  ON exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exams"
  ON exams FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exams"
  ON exams FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
CREATE POLICY "Users can view own assignments"
  ON assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments"
  ON assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments"
  ON assignments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignments"
  ON assignments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- CLUBS (public read for university members)
-- ============================================================
CREATE POLICY "Users can view clubs for their university"
  ON clubs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.university_id = clubs.university_id
    )
  );

-- ============================================================
-- CAMPUS_EVENTS (public read for university members)
-- ============================================================
CREATE POLICY "Users can view campus events for their university"
  ON campus_events FOR SELECT
  USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.university_id = campus_events.university_id
    )
  );

-- ============================================================
-- EVENT_REGISTRATIONS
-- ============================================================
CREATE POLICY "Users can view own event registrations"
  ON event_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event registrations"
  ON event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event registrations"
  ON event_registrations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own event registrations"
  ON event_registrations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- MESS_MENUS (read for university members)
-- ============================================================
CREATE POLICY "Users can view mess menus for their university"
  ON mess_menus FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.university_id = mess_menus.university_id
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- SYNC_LOGS
-- ============================================================
CREATE POLICY "Users can view own sync logs"
  ON sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
  ON sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync logs"
  ON sync_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- USER_PREFERENCES
-- ============================================================
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);
