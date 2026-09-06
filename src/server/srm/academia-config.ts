export const SRM_CONFIG = {
  baseUrl: "https://academia.srmist.edu.in",
  portalId: "10002227248",
  serviceName: "ZohoCreator",
  signInUrl: "https://academia.srmist.edu.in/accounts/signin.ac",
  logoutUrl:
    "https://academia.srmist.edu.in/accounts/p/10002227248/logout?servicename=ZohoCreator&serviceurl=https://academia.srmist.edu.in/",
  // Stable authenticated endpoint for session verification
  // This page exists for all logged-in students regardless of semester/year
  sessionVerifyPage:
    "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance",
  // Timetable pages - discovered dynamically after auth
  timetablePages: [
    "My_Time_Table_2023_24",
    "My_Time_Table_2024_25",
    "My_Time_Table_2025_26",
    "My_Time_Table_2026_27",
  ],
  // Profile page - discovered dynamically
  profilePages: [
    "Student_Profile",
    "My_Profile",
    "Profile",
  ],
  // Calendar / planner pages
  calendarPages: [
    "Academic_Planner_2023_24_EVEN",
    "Academic_Planner_2023_24_ODD",
    "Academic_Planner_2024_25_EVEN",
    "Academic_Planner_2024_25_ODD",
    "Academic_Planner_2025_26_EVEN",
    "Academic_Planner_2025_26_ODD",
    "Academic_Planner_2026_27_EVEN",
    "Academic_Planner_2026_27_ODD",
  ],
  captchaUrl:
    "https://academia.srmist.edu.in/accounts/p/40-10002227248/webclient/v1/captcha/{cdigest}?darkmode=false",
  browserHeaders: {
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Connection: "keep-alive",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Referer: "https://academia.srmist.edu.in/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    dnt: "1",
    "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-gpc": "1",
  },
} as const;

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
