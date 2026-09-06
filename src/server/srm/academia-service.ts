import { SRMLoginService } from "./login-service";
import { AcademiaClient } from "./academia-client";
import { SRM_CONFIG, type SRMCookieJar } from "./academia-config";
import { decodeAcademiaPage } from "./decode-academia-page";
import { parseStudentProfile } from "./parsers/profile-parser";
import { parseAttendance, parseMarks } from "./parsers/attendance-parser";
import { parseCourses } from "./parsers/course-parser";
import { classifySRMError } from "./error-codes";
import { normalizeAttendance, normalizeMarks, normalizeCourses, profileSchema, type SyncData } from "./normalized-data";

export async function authenticateWithSRM(netId: string, password: string,
  existingCookies?: SRMCookieJar, captchaDigest?: string, captchaAnswer?: string, requestId?: string) {
  const login = new SRMLoginService(requestId);
  if (existingCookies) login.getClient().setCookies(existingCookies);
  const result = await login.login(netId, password, captchaDigest, captchaAnswer);
  if (!result.success) return { ...result, success: false as const, stageLogs: login.getStageLogs() };
  const profile = profileSchema.safeParse(login.getProfile());
  if (!profile.success) return { success: false as const, error: "SRM_PROFILE_PARSE_FAILED",
    cookies: result.cookies, stageLogs: login.getStageLogs() };
  return { success: true as const, profile: profile.data, cookies: result.cookies, stageLogs: login.getStageLogs() };
}

async function page(client: AcademiaClient, url: string) {
  const response = await client.get(url);
  if (response.status !== 200) throw new Error("SRM_SERVER_REJECTED");
  const decoded = decodeAcademiaPage(response.text);
  if (decoded.error) throw new Error(decoded.error);
  return decoded.html;
}

export async function syncAllData(cookies: SRMCookieJar, expectedRegNumber: string): Promise<SyncData> {
  const client = new AcademiaClient();
  client.setCookies(cookies);
  const data: SyncData = { profile: null, attendance: null, marks: null, courses: null, errors: {}, cookies };
  const capture = (component: keyof SyncData["errors"], error: unknown) => {
    data.errors[component] = classifySRMError(error);
  };
  try {
    // One authenticated fetch supplies profile, attendance and marks.
    const html = await page(client, SRM_CONFIG.sessionVerifyPage);
    const profile = profileSchema.safeParse(parseStudentProfile(html));
    if (!profile.success) throw new Error("SRM_PROFILE_PARSE_FAILED");
    if (profile.data.regNumber !== expectedRegNumber) throw new Error("SRM_IDENTITY_MISMATCH");
    data.profile = profile.data;
    try { data.attendance = normalizeAttendance(parseAttendance(html).attendance, html); }
    catch (error) { capture("attendance", error); }
    try { data.marks = normalizeMarks(parseMarks(html).marks, html); }
    catch (error) { capture("marks", error); }
  } catch (error) {
    capture("profile", error);
    data.errors.attendance = data.errors.profile;
    data.errors.marks = data.errors.profile;
  }
  // Stop upstream work immediately after session expiry or identity inconsistency.
  if (!data.profile) {
    data.errors.courses = data.errors.profile;
    data.cookies = client.getCookies();
    return data;
  }
  try {
    const navigation = await page(client, SRM_CONFIG.baseUrl);
    // Use the link advertised by this account, never a guessed academic year.
    const names = [...navigation.matchAll(/My_Time_Table_\d{4}_\d{2}/g)].map((match) => match[0]);
    const name = [...new Set(names)].sort().at(-1);
    if (!name) throw new Error("SRM_SCHEMA_CHANGED");
    const html = await page(client, `${SRM_CONFIG.baseUrl}/srm_university/academia-academic-services/page/${name}`);
    const parsed = parseCourses(html);
    if (parsed.regNumber !== expectedRegNumber) throw new Error("SRM_IDENTITY_MISMATCH");
    data.courses = normalizeCourses(parsed.courses, html);
  } catch (error) { capture("courses", error); }
  data.cookies = client.getCookies();
  return data;
}

