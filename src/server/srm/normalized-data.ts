import { z } from "zod";
import type { SRMAttendance, SRMMarks, SRMCourse, SRMCookieJar } from "./academia-config";
import type { SRMErrorCode } from "./error-codes";

const text = z.string().trim().min(1).max(500).refine((value) => !/[<>]/.test(value));
const optionalText = text.nullable();
export const profileSchema = z.object({
  name: text, regNumber: z.string().regex(/^RA\d{13}$/),
  program: optionalText, department: optionalText,
  semester: z.number().int().min(1).max(12).nullable(),
  section: optionalText, batch: optionalText, mobile: optionalText,
});
const attendanceSchema = z.object({
  code: text, name: text, conducted: z.number().int().nonnegative(),
  attended: z.number().int().nonnegative(),
}).refine((row) => row.attended <= row.conducted);
const markSchema = z.object({
  code: text, name: text.nullable(), assessment: text,
  scored: z.number().nonnegative().nullable(), total: z.number().positive(), absent: z.boolean(),
}).refine((row) => row.scored === null ? row.absent : row.scored <= row.total);
const courseSchema = z.object({
  code: text, name: text, credits: z.number().nonnegative().nullable(),
  faculty: optionalText, slot: optionalText, room: optionalText, academicYear: optionalText,
});
export type NormalizedProfile = z.infer<typeof profileSchema>;
export type NormalizedAttendance = z.infer<typeof attendanceSchema>;
export type NormalizedMark = z.infer<typeof markSchema>;
export type NormalizedCourse = z.infer<typeof courseSchema>;
export type SyncComponent = "profile" | "attendance" | "marks" | "courses";
export interface SyncData {
  profile: NormalizedProfile | null;
  attendance: NormalizedAttendance[] | null;
  marks: NormalizedMark[] | null;
  courses: NormalizedCourse[] | null;
  errors: Partial<Record<SyncComponent, SRMErrorCode>>;
  cookies: SRMCookieJar;
}
function nullable(value: string) { return !value.trim() || /^(n\/a|null|-)$/i.test(value.trim()) ? null : value.trim(); }
function numeric(value: string) { return /^\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : NaN; }
function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error("SRM_SCHEMA_CHANGED");
  return parsed.data;
}
function unique(keys: string[]) {
  if (new Set(keys).size !== keys.length) throw new Error("SRM_SCHEMA_CHANGED");
}
export function normalizeAttendance(rows: SRMAttendance[], html: string) {
  if (!rows.length && !/no attendance (?:records|data)(?: available)?/i.test(html)) throw new Error("SRM_SCHEMA_CHANGED");
  const data = rows.map((row) => validate(attendanceSchema, { code: row.courseCode.trim(), name: row.courseTitle,
    conducted: numeric(row.hoursConducted), attended: numeric(row.hoursConducted) - numeric(row.hoursAbsent) }));
  unique(data.map((row) => row.code));
  return data;
}
export function normalizeMarks(rows: SRMMarks[], html: string) {
  if (!rows.length && !/no marks (?:published|available)|marks (?:not yet|not) published/i.test(html)) throw new Error("SRM_SCHEMA_CHANGED");
  const data = rows.flatMap((row) => row.testPerformance.map((test) => validate(markSchema, {
    code: row.courseCode.trim(), name: nullable(row.courseName), assessment: test.test.trim(),
    scored: test.marks.scored === "Abs" ? null : numeric(test.marks.scored),
    total: numeric(test.marks.total), absent: test.marks.scored === "Abs",
  })));
  unique(data.map((row) => JSON.stringify([row.code, row.assessment])));
  return data;
}
export function normalizeCourses(rows: SRMCourse[], html: string) {
  if (!rows.length && !/no courses (?:registered|available)/i.test(html)) throw new Error("SRM_SCHEMA_CHANGED");
  const data = rows.map((row) => validate(courseSchema, {
    code: row.code, name: row.title, credits: nullable(row.credit) === null ? null : numeric(row.credit),
    faculty: nullable(row.faculty), slot: nullable(row.slot), room: nullable(row.room), academicYear: nullable(row.academicYear),
  }));
  unique(data.map((row) => row.code));
  return data;
}

