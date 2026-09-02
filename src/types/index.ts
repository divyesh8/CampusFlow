export interface University {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  defaultAttendanceThreshold: number;
  timezone: string;
  provider: string;
  campuses: Campus[];
}

export interface Campus {
  id: string;
  name: string;
  universityId: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  universityId: string;
  campusId?: string;
  studentId: string;
  name: string;
  email: string;
  phone?: string;
  program: string;
  department: string;
  year: number;
  semester: number;
  section?: string;
  attendanceThreshold: number;
  avatarUrl?: string;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  universityId: string;
  semester: number;
  department: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  courseId: string;
  faculty?: string;
  room?: string;
  building?: string;
  credits: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  subjectId: string;
  semester: number;
  academicYear: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  status: "present" | "absent" | "cancelled" | "extra";
  source: "university" | "manual" | "import";
}

export interface AttendanceSnapshot {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  attended: number;
  conducted: number;
  percentage: number;
}

export interface SubjectAttendance {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  attended: number;
  conducted: number;
  percentage: number;
  status: "safe" | "warning" | "critical";
  canBunk: number;
  mustAttend: number;
}

export interface TimetableEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  building?: string;
  faculty?: string;
  type: "class" | "lab" | "tutorial" | "break";
}

export interface TimetableOverride {
  id: string;
  originalEntryId: string;
  date: string;
  newStartTime?: string;
  newEndTime?: string;
  newRoom?: string;
  newBuilding?: string;
  cancelled: boolean;
  reason?: string;
}

export interface Assessment {
  id: string;
  subjectId: string;
  name: string;
  type: "exam" | "assignment" | "lab" | "quiz" | "project" | "viva";
  maxMarks: number;
  weightage: number;
  date?: string;
}

export interface Mark {
  id: string;
  studentId: string;
  assessmentId: string;
  subjectId: string;
  marksObtained: number;
  maxMarks: number;
  publishedAt: string;
}

export interface SubjectMarks {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  assessments: {
    assessmentId: string;
    name: string;
    type: string;
    marksObtained: number;
    maxMarks: number;
    weightage: number;
  }[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
}

export interface AcademicEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type: "holiday" | "exam" | "assignment" | "event" | "class" | "registration" | "other";
  subjectId?: string;
  location?: string;
  isAllDay: boolean;
}

export interface Exam {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  building?: string;
  type: "midterm" | "final" | "quiz" | "practical" | "other";
  preparationStatus: "not_started" | "revising" | "ready";
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  description?: string;
  dueDate: string;
  submissionLink?: string;
  status: "not_started" | "in_progress" | "submitted";
  priority: "low" | "medium" | "high";
}

export interface CampusEvent {
  id: string;
  title: string;
  description?: string;
  clubId?: string;
  clubName?: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  category: "technical" | "cultural" | "sports" | "workshop" | "hackathon" | "career" | "club" | "fest";
  imageUrl?: string;
  registrationUrl?: string;
  registrationLimit?: number;
  registeredCount?: number;
  isRegistered?: boolean;
}

export interface Club {
  id: string;
  name: string;
  logo?: string;
  description: string;
  category: "technical" | "cultural" | "sports" | "entrepreneurship" | "music" | "dance" | "gaming" | "photography" | "social_service";
  socialLinks?: {
    website?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  upcomingEvents?: CampusEvent[];
  pastEvents?: CampusEvent[];
}

export interface MessMenu {
  id: string;
  date: string;
  meals: {
    type: "breakfast" | "lunch" | "snacks" | "dinner";
    items: string[];
  }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: "attendance" | "marks" | "timetable" | "exam" | "assignment" | "event" | "system";
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  timezone: string;
  attendanceThreshold: number;
  notifications: {
    attendance: boolean;
    marks: boolean;
    timetable: boolean;
    exams: boolean;
    assignments: boolean;
    events: boolean;
  };
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TodayOverview {
  totalClasses: number;
  completedClasses: number;
  nextClass: TimetableEntry | null;
  timeUntilNext: string;
  attendanceRisk: SubjectAttendance | null;
  dueToday: Assignment[];
  upcomingEvents: CampusEvent[];
  todayMess: MessMenu | null;
}

export interface AcademicStanding {
  attendanceHealth: {
    status: "good" | "warning" | "critical";
    safeCount: number;
    warningCount: number;
    criticalCount: number;
  };
  semesterProgress: {
    currentWeek: number;
    totalWeeks: number;
    percentage: number;
  };
  assessmentPerformance: {
    averageScore: number;
    highestSubject: string;
    lowestSubject: string;
  };
}

export interface ChangeLog {
  type: "attendance" | "marks" | "timetable" | "exam" | "assignment";
  title: string;
  description: string;
  timestamp: string;
  subjectName?: string;
}
