-- CampusFlow Database Schema
-- Multi-university, multi-semester student academic platform
-- Uses UUID primary keys, proper FK constraints, and indexes

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. UNIVERSITIES
-- ============================================================
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  default_attendance_threshold INTEGER NOT NULL DEFAULT 75 CHECK (default_attendance_threshold BETWEEN 0 AND 100),
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  provider TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_universities_short_name ON universities (short_name);

-- ============================================================
-- 2. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  campus_id UUID,
  student_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  program TEXT,
  department TEXT,
  year INTEGER DEFAULT 1,
  semester INTEGER DEFAULT 1,
  section TEXT,
  attendance_threshold INTEGER DEFAULT 75 CHECK (attendance_threshold BETWEEN 0 AND 100),
  avatar_url TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_university ON profiles (university_id);
CREATE INDEX idx_profiles_email ON profiles (email);

-- ============================================================
-- 3. CAMPUSES
-- ============================================================
CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campuses_university ON campuses (university_id);

-- Add FK from profiles to campuses
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_campus
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL;

-- ============================================================
-- 4. UNIVERSITY_CONNECTIONS
-- ============================================================
CREATE TABLE university_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  student_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, university_id)
);

CREATE INDEX idx_university_connections_user ON university_connections (user_id);

-- ============================================================
-- 5. ACADEMIC_YEARS
-- ============================================================
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (university_id, name)
);

CREATE INDEX idx_academic_years_university ON academic_years (university_id);

-- ============================================================
-- 6. SEMESTERS
-- ============================================================
CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 10),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_weeks INTEGER NOT NULL DEFAULT 16,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, number)
);

CREATE INDEX idx_semesters_academic_year ON semesters (academic_year_id);

-- ============================================================
-- 7. SUBJECTS
-- ============================================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  department TEXT,
  credits INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subjects_university_semester ON subjects (university_id, semester);
CREATE INDEX idx_subjects_code ON subjects (code);

-- ============================================================
-- 8. ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_id, semester, academic_year)
);

CREATE INDEX idx_enrollments_user ON enrollments (user_id);
CREATE INDEX idx_enrollments_subject ON enrollments (subject_id);

-- ============================================================
-- 9. ATTENDANCE_RECORDS
-- ============================================================
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'cancelled', 'extra')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('university', 'manual', 'import')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_id, date)
);

CREATE INDEX idx_attendance_records_user ON attendance_records (user_id);
CREATE INDEX idx_attendance_records_user_subject ON attendance_records (user_id, subject_id);
CREATE INDEX idx_attendance_records_date ON attendance_records (date);

-- ============================================================
-- 10. ATTENDANCE_SNAPSHOTS (for historical tracking)
-- ============================================================
CREATE TABLE attendance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  attended INTEGER NOT NULL,
  conducted INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendance_snapshots_user ON attendance_snapshots (user_id);
CREATE INDEX idx_attendance_snapshots_user_subject ON attendance_snapshots (user_id, subject_id);
CREATE INDEX idx_attendance_snapshots_date ON attendance_snapshots (date);

-- ============================================================
-- 11. ASSESSMENTS
-- ============================================================
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('exam', 'assignment', 'lab', 'quiz', 'project', 'viva')),
  max_marks INTEGER NOT NULL CHECK (max_marks > 0),
  weightage INTEGER NOT NULL DEFAULT 0 CHECK (weightage BETWEEN 0 AND 100),
  date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_subject ON assessments (subject_id);

-- ============================================================
-- 12. MARKS
-- ============================================================
CREATE TABLE marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  marks_obtained INTEGER NOT NULL CHECK (marks_obtained >= 0),
  max_marks INTEGER NOT NULL CHECK (max_marks > 0),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, assessment_id)
);

CREATE INDEX idx_marks_user ON marks (user_id);
CREATE INDEX idx_marks_user_subject ON marks (user_id, subject_id);

-- ============================================================
-- 13. TIMETABLES
-- ============================================================
CREATE TABLE timetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  semester INTEGER NOT NULL,
  academic_year TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timetables_user ON timetables (user_id);

-- ============================================================
-- 14. TIMETABLE_ENTRIES
-- ============================================================
CREATE TABLE timetable_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  building TEXT,
  faculty TEXT,
  type TEXT NOT NULL DEFAULT 'class' CHECK (type IN ('class', 'lab', 'tutorial', 'break')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timetable_entries_timetable ON timetable_entries (timetable_id);
CREATE INDEX idx_timetable_entries_day ON timetable_entries (day_of_week);

-- ============================================================
-- 15. TIMETABLE_OVERRIDES
-- ============================================================
CREATE TABLE timetable_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_entry_id UUID NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  new_start_time TIME,
  new_end_time TIME,
  new_room TEXT,
  new_building TEXT,
  cancelled BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timetable_overrides_entry ON timetable_overrides (original_entry_id);
CREATE INDEX idx_timetable_overrides_date ON timetable_overrides (date);

-- ============================================================
-- 16. ACADEMIC_EVENTS
-- ============================================================
CREATE TABLE academic_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  type TEXT NOT NULL CHECK (type IN ('holiday', 'exam', 'assignment', 'event', 'class', 'registration', 'other')),
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  location TEXT,
  is_all_day BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_academic_events_user ON academic_events (user_id);
CREATE INDEX idx_academic_events_date ON academic_events (date);

-- ============================================================
-- 17. EXAMS
-- ============================================================
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  building TEXT,
  type TEXT NOT NULL CHECK (type IN ('midterm', 'final', 'quiz', 'practical', 'other')),
  preparation_status TEXT NOT NULL DEFAULT 'not_started' CHECK (preparation_status IN ('not_started', 'revising', 'ready')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exams_user ON exams (user_id);
CREATE INDEX idx_exams_date ON exams (date);

-- ============================================================
-- 18. ASSIGNMENTS
-- ============================================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  submission_link TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_user ON assignments (user_id);
CREATE INDEX idx_assignments_due_date ON assignments (due_date);

-- ============================================================
-- 19. CLUBS
-- ============================================================
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'cultural', 'sports', 'entrepreneurship', 'music', 'dance', 'gaming', 'photography', 'social_service')),
  website_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clubs_university ON clubs (university_id);
CREATE INDEX idx_clubs_category ON clubs (category);

-- ============================================================
-- 20. CAMPUS_EVENTS
-- ============================================================
CREATE TABLE campus_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  category TEXT NOT NULL CHECK (category IN ('technical', 'cultural', 'sports', 'workshop', 'hackathon', 'career', 'club', 'fest')),
  image_url TEXT,
  registration_url TEXT,
  registration_limit INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campus_events_university ON campus_events (university_id);
CREATE INDEX idx_campus_events_date ON campus_events (date);
CREATE INDEX idx_campus_events_category ON campus_events (category);

-- ============================================================
-- 21. EVENT_REGISTRATIONS
-- ============================================================
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES campus_events(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'waitlisted')),
  UNIQUE (user_id, event_id)
);

CREATE INDEX idx_event_registrations_user ON event_registrations (user_id);
CREATE INDEX idx_event_registrations_event ON event_registrations (event_id);

-- ============================================================
-- 22. MESS_MENUS
-- ============================================================
CREATE TABLE mess_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (university_id, campus_id, date, meal_type)
);

CREATE INDEX idx_mess_menus_university_date ON mess_menus (university_id, date);

-- ============================================================
-- 23. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('attendance', 'marks', 'timetable', 'exam', 'assignment', 'event', 'system')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_user_read ON notifications (user_id, read);

-- ============================================================
-- 24. SYNC_LOGS
-- ============================================================
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'syncing', 'success', 'partial', 'failed')),
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_logs_user ON sync_logs (user_id);

-- ============================================================
-- 25. USER_PREFERENCES
-- ============================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  attendance_threshold INTEGER NOT NULL DEFAULT 75 CHECK (attendance_threshold BETWEEN 0 AND 100),
  notify_attendance BOOLEAN NOT NULL DEFAULT true,
  notify_marks BOOLEAN NOT NULL DEFAULT true,
  notify_timetable BOOLEAN NOT NULL DEFAULT true,
  notify_exams BOOLEAN NOT NULL DEFAULT true,
  notify_assignments BOOLEAN NOT NULL DEFAULT true,
  notify_events BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_university_connections BEFORE UPDATE ON university_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_subjects BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_assessments BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_marks BEFORE UPDATE ON marks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_timetables BEFORE UPDATE ON timetables FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_timetable_entries BEFORE UPDATE ON timetable_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_academic_events BEFORE UPDATE ON academic_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_exams BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_assignments BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_clubs BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_campus_events BEFORE UPDATE ON campus_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_universities BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_user_preferences BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ENABLE RLS ON ALL TABLES (policies in next migration)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
