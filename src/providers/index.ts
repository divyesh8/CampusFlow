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
    return [];
  }

  async getTimetable() {
    return [];
  }

  async getMarks() {
    return [];
  }

  async getExams() {
    return [];
  }

  async getAssignments() {
    return [];
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
