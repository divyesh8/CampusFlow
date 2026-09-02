import type { StudentProfile, SubjectAttendance, TimetableEntry, Exam, Assignment } from "@/types";
import { calculateAttendancePercentage, calculateAttendanceStatus, calculateCanBunk, calculateMustAttend } from "@/utils/calculations";
import { DEMO_ATTENDANCE, DEMO_TIMETABLE, DEMO_MARKS, DEMO_EXAMS, DEMO_ASSIGNMENTS } from "@/utils/demo-data";

export interface UniversityProvider {
  authenticate(credentials: { studentId: string; password: string }): Promise<{ success: boolean; error?: string }>;
  getStudentProfile(): Promise<StudentProfile | null>;
  getAttendance(subjectIds: string[]): Promise<SubjectAttendance[]>;
  getTimetable(): Promise<TimetableEntry[]>;
  getMarks(): Promise<{ subjectId: string; subjectName: string; subjectCode: string; assessmentName: string; assessmentType: string; marksObtained: number; maxMarks: number; weightage: number }[]>;
  getExams(): Promise<Exam[]>;
  getAssignments(): Promise<Assignment[]>;
}

class MockProvider implements UniversityProvider {
  async authenticate() {
    return { success: true };
  }
  async getStudentProfile() {
    return null;
  }
  async getAttendance(subjectIds: string[]) {
    return DEMO_ATTENDANCE.filter((a) => subjectIds.includes(a.subjectId));
  }
  async getTimetable() {
    return DEMO_TIMETABLE;
  }
  async getMarks() {
    return DEMO_MARKS;
  }
  async getExams() {
    return DEMO_EXAMS;
  }
  async getAssignments() {
    return DEMO_ASSIGNMENTS;
  }
}

class SRMProvider implements UniversityProvider {
  async authenticate() {
    return { success: true };
  }
  async getStudentProfile() {
    return null;
  }
  async getAttendance() {
    return DEMO_ATTENDANCE;
  }
  async getTimetable() {
    return DEMO_TIMETABLE;
  }
  async getMarks() {
    return DEMO_MARKS;
  }
  async getExams() {
    return DEMO_EXAMS;
  }
  async getAssignments() {
    return DEMO_ASSIGNMENTS;
  }
}

class ManualProvider implements UniversityProvider {
  async authenticate() {
    return { success: true };
  }
  async getStudentProfile() {
    return null;
  }
  async getAttendance() {
    return DEMO_ATTENDANCE;
  }
  async getTimetable() {
    return DEMO_TIMETABLE;
  }
  async getMarks() {
    return DEMO_MARKS;
  }
  async getExams() {
    return DEMO_EXAMS;
  }
  async getAssignments() {
    return DEMO_ASSIGNMENTS;
  }
}

const providers: Record<string, UniversityProvider> = {
  mock: new MockProvider(),
  srm: new SRMProvider(),
  manual: new ManualProvider(),
};

export function getProvider(name: string): UniversityProvider {
  return providers[name] || providers.manual;
}
