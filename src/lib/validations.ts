import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const onboardingSchema = z.object({
  universityId: z.string().min(1, "Please select a university"),
  campusId: z.string().optional(),
  program: z.string().min(1, "Program is required"),
  department: z.string().min(1, "Department is required"),
  year: z.number().int().min(1).max(5),
  semester: z.number().int().min(1).max(10),
  section: z.string().optional(),
  attendanceThreshold: z.number().int().min(50).max(100),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  program: z.string().optional(),
  department: z.string().optional(),
  year: z.number().int().min(1).max(5).optional(),
  semester: z.number().int().min(1).max(10).optional(),
  section: z.string().optional(),
  attendanceThreshold: z.number().int().min(50).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const attendanceInputSchema = z.object({
  subjectId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  status: z.enum(["present", "absent", "cancelled", "extra"]),
  source: z.enum(["university", "manual", "import"]).default("manual"),
});

export type AttendanceInput = z.infer<typeof attendanceInputSchema>;

export const marksInputSchema = z.object({
  subjectId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  marksObtained: z.number().int().min(0, "Marks cannot be negative"),
  maxMarks: z.number().int().min(1, "Max marks must be at least 1"),
});

export type MarksInput = z.infer<typeof marksInputSchema>;

export const assignmentSchema = z.object({
  subjectId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  submissionLink: z.string().url().optional().nullable(),
  status: z.enum(["not_started", "in_progress", "submitted"]).default("not_started"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const examSchema = z.object({
  subjectId: z.string().uuid(),
  name: z.string().min(1, "Exam name is required").max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  room: z.string().optional(),
  building: z.string().optional(),
  type: z.enum(["midterm", "final", "quiz", "practical", "other"]),
});

export type ExamInput = z.infer<typeof examSchema>;

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  type: z.enum(["holiday", "exam", "assignment", "event", "class", "registration", "other"]),
  subjectId: z.string().uuid().optional().nullable(),
  location: z.string().optional(),
  isAllDay: z.boolean().default(true),
});

export type EventInput = z.infer<typeof eventSchema>;

export const eventRegistrationSchema = z.object({
  eventId: z.string().uuid(),
});

export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;

export const messEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  mealType: z.enum(["breakfast", "lunch", "snacks", "dinner"]),
  items: z.array(z.string().min(1)).min(1, "At least one item is required"),
});

export type MessEntryInput = z.infer<typeof messEntrySchema>;

export const timetableEntrySchema = z.object({
  subjectId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  room: z.string().optional(),
  building: z.string().optional(),
  faculty: z.string().optional(),
  type: z.enum(["class", "lab", "tutorial", "break"]).default("class"),
});

export type TimetableEntryInput = z.infer<typeof timetableEntrySchema>;

export const notificationPreferencesSchema = z.object({
  attendance: z.boolean(),
  marks: z.boolean(),
  timetable: z.boolean(),
  exams: z.boolean(),
  assignments: z.boolean(),
  events: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  timezone: z.string().min(1),
  attendanceThreshold: z.number().int().min(50).max(100),
  notifications: notificationPreferencesSchema,
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

export const universityConnectionSchema = z.object({
  universityId: z.string().uuid(),
  campusId: z.string().uuid().optional().nullable(),
  studentId: z.string().min(1, "Student ID is required"),
  provider: z.string().default("manual"),
});

export type UniversityConnectionInput = z.infer<typeof universityConnectionSchema>;
