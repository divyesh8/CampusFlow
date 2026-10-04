// Legacy data types only; no network or authentication configuration. Not Student Portal schemas.
export interface SRMCookieJar {
  [key: string]: string;
}

export interface SRMLoginResult {
  success: boolean;
  cookies: SRMCookieJar;
  error?: string;
  requiresCaptcha?: boolean;
  captchaImage?: string;
  captchaDigest?: string;
  status?: number;
}

export interface SRMStudentProfile {
  name: string;
  regNumber: string;
  program: string | null;
  department: string | null;
  semester: number | null;
  section: string | null;
  batch: string | null;
  mobile: string | null;
}

export interface SRMAttendance {
  courseCode: string;
  courseTitle: string;
  category: string;
  facultyName: string;
  slot: string;
  hoursConducted: string;
  hoursAbsent: string;
  attendancePercentage: string;
}

export interface SRMMarks {
  courseCode: string;
  courseName: string;
  courseType: string;
  overall: { scored: string; total: string };
  testPerformance: {
    test: string;
    marks: { scored: string; total: string };
  }[];
}

export interface SRMCourse {
  code: string;
  title: string;
  credit: string;
  category: string;
  courseCategory: string;
  type: string;
  slotType: string;
  faculty: string;
  slot: string;
  room: string;
  academicYear: string;
}
