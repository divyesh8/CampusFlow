import { SRMLoginService } from "./login-service";
import { AcademiaClient } from "./academia-client";
import { SRM_CONFIG, type SRMCookieJar } from "./academia-config";
import { parseStudentProfile } from "./parsers/profile-parser";
import { parseAttendance, parseMarks } from "./parsers/attendance-parser";
import { parseCourses } from "./parsers/course-parser";

export interface SRMProfileData {
  name: string;
  regNumber: string;
  program: string;
  department: string;
  semester: number;
  section: string;
  batch: string;
  mobile: string;
}

export type SRMAuthResult =
  | {
      success: true;
      cookies: SRMCookieJar;
      profile: SRMProfileData;
    }
  | {
      success: false;
      error: string;
      requiresCaptcha?: boolean;
      captchaImage?: string;
      captchaDigest?: string;
    };

export async function authenticateWithSRM(
  netId: string,
  password: string,
  existingCookies?: SRMCookieJar,
  captchaDigest?: string,
  captchaAnswer?: string
): Promise<SRMAuthResult> {
  const loginService = new SRMLoginService();

  if (existingCookies) {
    loginService.getClient().setCookies(existingCookies);
  }

  const loginResult = await loginService.login(
    netId,
    password,
    captchaDigest,
    captchaAnswer
  );

  if (!loginResult.success) {
    if (loginResult.requiresCaptcha) {
      return {
        success: false,
        error: loginResult.error || "Verification required",
        requiresCaptcha: true,
        captchaImage: loginResult.captchaImage,
        captchaDigest: loginResult.captchaDigest,
      };
    }
    return {
      success: false,
      error: loginResult.error || "Authentication failed",
    };
  }

  try {
    const profile = await fetchStudentProfile(loginResult.cookies);
    if (!profile) {
      return {
        success: false,
        error: "Connected to SRM, but couldn't read your profile",
      };
    }

    return {
      success: true,
      cookies: loginResult.cookies,
      profile,
    };
  } catch {
    return {
      success: false,
      error: "Failed to fetch student profile from SRM",
    };
  }
}

async function fetchStudentProfile(
  cookies: SRMCookieJar
): Promise<SRMProfileData | null> {
  const client = new AcademiaClient();
  client.setCookies(cookies);

  const response = await client.get(SRM_CONFIG.coursePage, {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  });

  if (response.status !== 200) {
    return null;
  }

  const profile = parseStudentProfile(response.text);

  if (!profile.name && !profile.regNumber) {
    return null;
  }

  return {
    name: profile.name,
    regNumber: profile.regNumber,
    program: profile.program,
    department: profile.department,
    semester: profile.semester,
    section: profile.section,
    batch: profile.batch,
    mobile: profile.mobile,
  };
}

export async function fetchAttendance(cookies: SRMCookieJar) {
  const client = new AcademiaClient();
  client.setCookies(cookies);

  const response = await client.get(SRM_CONFIG.attendancePage, {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  });

  if (response.status !== 200) {
    return { regNumber: "", attendance: [], error: `HTTP ${response.status}` };
  }

  return parseAttendance(response.text);
}

export async function fetchMarks(cookies: SRMCookieJar) {
  const client = new AcademiaClient();
  client.setCookies(cookies);

  const response = await client.get(SRM_CONFIG.attendancePage, {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  });

  if (response.status !== 200) {
    return { regNumber: "", marks: [], error: `HTTP ${response.status}` };
  }

  return parseMarks(response.text);
}

export async function fetchCourses(cookies: SRMCookieJar) {
  const client = new AcademiaClient();
  client.setCookies(cookies);

  const response = await client.get(SRM_CONFIG.coursePage, {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  });

  if (response.status !== 200) {
    return { regNumber: "", courses: [], error: `HTTP ${response.status}` };
  }

  return parseCourses(response.text);
}

export async function syncAllData(cookies: SRMCookieJar) {
  const [attendance, marks, courses] = await Promise.all([
    fetchAttendance(cookies),
    fetchMarks(cookies),
    fetchCourses(cookies),
  ]);

  return {
    attendance: attendance.attendance || [],
    marks: marks.marks || [],
    courses: courses.courses || [],
    errors: {
      attendance: "error" in attendance ? attendance.error : null,
      marks: "error" in marks ? marks.error : null,
      courses: "error" in courses ? courses.error : null,
    },
  };
}
