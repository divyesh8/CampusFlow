import type {
  StudentProfile,
  SubjectAttendance,
  TimetableEntry,
  Exam,
  Assignment,
  SubjectMarks,
} from "@/types";

export interface UniversityProvider {
  readonly name: string;
  readonly displayName: string;
  readonly isAvailable: boolean;

  authenticate(credentials: {
    netId: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;

  getStudentProfile(): Promise<StudentProfile | null>;
  getAttendance(): Promise<SubjectAttendance[]>;
  getTimetable(): Promise<TimetableEntry[]>;
  getMarks(): Promise<SubjectMarks[]>;
  getExams(): Promise<Exam[]>;
  getAssignments(): Promise<Assignment[]>;
  disconnect(): Promise<void>;
}

class SRMProvider implements UniversityProvider {
  readonly name = "srm";
  readonly displayName = "SRM Institute of Science and Technology";
  readonly isAvailable = true;

  async authenticate(credentials: { netId: string; password: string }) {
    try {
      const res = await fetch("/api/srm/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false as const, error: data.error || "Authentication failed." };
      }
      return {
        success: true as const,
        requiresVerification: data.requiresVerification || false,
      };
    } catch {
      return { success: false as const, error: "Network error. Please check your connection." };
    }
  }

  async getStudentProfile() {
    try {
      const res = await fetch("/api/srm/session");
      if (!res.ok) return null;
      const data = await res.json();
      return data.profile || null;
    } catch {
      return null;
    }
  }

  async getAttendance() {
    const data = await this.getData();
    const latest = new Map<string, (typeof data.attendance)[number]>();
    for (const row of data.attendance) if (!latest.has(row.subject_id)) latest.set(row.subject_id, row);
    return [...latest.entries()].map(([subjectId, row]) => {
      const subject = data.subjects.find((item) => item.id === subjectId);
      const percentage = Number(row.percentage);
      return { subjectId, subjectName: subject?.name || "", subjectCode: subject?.code || "",
        attended: row.attended, conducted: row.conducted, percentage,
        status: percentage >= 80 ? "safe" as const : percentage >= 75 ? "warning" as const : "critical" as const,
        canBunk: 0, mustAttend: 0 };
    });
  }

  async getTimetable(): Promise<TimetableEntry[]> {
    throw new Error("SRM_TIMETABLE_SCHEDULE_UNAVAILABLE");
  }

  async getMarks() {
    const data = await this.getData();
    return data.marks.map((mark) => {
      const subject = Array.isArray(mark.subjects) ? mark.subjects[0] : mark.subjects;
      const assessment = Array.isArray(mark.assessments) ? mark.assessments[0] : mark.assessments;
      return { subjectId: mark.subject_id, subjectName: subject?.name || "", subjectCode: subject?.code || "",
        assessments: [{ assessmentId: mark.assessment_id, name: assessment?.name || "Assessment", type: assessment?.type || "other",
          marksObtained: mark.marks_obtained ?? 0, maxMarks: mark.max_marks, weightage: assessment?.weightage || 0 }],
        totalObtained: mark.marks_obtained ?? 0, totalMax: mark.max_marks,
        percentage: mark.max_marks ? ((mark.marks_obtained ?? 0) / mark.max_marks) * 100 : 0 };
    });
  }

  async getExams(): Promise<Exam[]> {
    throw new Error("SRM_EXAMS_SOURCE_UNAVAILABLE");
  }

  async getAssignments(): Promise<Assignment[]> {
    throw new Error("SRM_ASSIGNMENTS_SOURCE_UNAVAILABLE");
  }

  private async getData() {
    const response = await fetch("/api/srm/data", { cache: "no-store" });
    if (!response.ok) throw new Error("SRM_DATA_UNAVAILABLE");
    return response.json() as Promise<{
      subjects: { id: string; name: string; code: string }[];
      attendance: { subject_id: string; attended: number; conducted: number; percentage: number }[];
      marks: { subject_id: string; assessment_id: string; marks_obtained: number | null; max_marks: number; subjects: { name: string; code: string } | { name: string; code: string }[] | null; assessments: { name: string; type: string | null; weightage: number | null } | { name: string; type: string | null; weightage: number | null }[] | null }[];
    }>;
  }

  async disconnect() {
    try {
      await fetch("/api/srm/session", { method: "DELETE" });
    } catch {
      // Ignore
    }
  }
}

const providers: Record<string, UniversityProvider> = {
  srm: new SRMProvider(),
};

export function getProvider(name: string): UniversityProvider {
  return providers[name] || providers.srm;
}

export function getAvailableProviders(): UniversityProvider[] {
  return Object.values(providers).filter((p) => p.isAvailable);
}

export function listProviders(): { name: string; displayName: string; isAvailable: boolean }[] {
  return Object.values(providers).map((p) => ({
    name: p.name,
    displayName: p.displayName,
    isAvailable: p.isAvailable,
  }));
}
