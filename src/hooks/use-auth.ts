import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { StudentProfile } from "@/types";
import { DEMO_MODE } from "@/config/constants";
import { DEMO_STUDENT } from "@/utils/demo-data";

interface AuthContextType {
  user: StudentProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      setUser(DEMO_STUDENT);
      setLoading(false);
      return;
    }
    const stored = localStorage.getItem("campusflow_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("campusflow_user");
      }
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    if (DEMO_MODE) {
      setUser(DEMO_STUDENT);
      localStorage.setItem("campusflow_user", JSON.stringify(DEMO_STUDENT));
      return {};
    }
    const stored = localStorage.getItem("campusflow_users");
    const users: Record<string, StudentProfile & { password?: string }> = stored ? JSON.parse(stored) : {};
    const found = Object.values(users).find((u) => u.email === email);
    if (!found) return { error: "No account found with this email." };
    setUser(found);
    localStorage.setItem("campusflow_user", JSON.stringify(found));
    return {};
  }, []);

  const signUp = useCallback(async (email: string, _password: string, name: string) => {
    if (DEMO_MODE) {
      setUser(DEMO_STUDENT);
      return {};
    }
    const newStudent: StudentProfile = {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      universityId: "manual",
      studentId: "MANUAL001",
      name,
      email,
      program: "",
      department: "",
      year: 1,
      semester: 1,
      attendanceThreshold: 75,
      onboarded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const stored = localStorage.getItem("campusflow_users");
    const users: Record<string, StudentProfile> = stored ? JSON.parse(stored) : {};
    if (Object.values(users).find((u) => u.email === email)) {
      return { error: "An account with this email already exists." };
    }
    users[newStudent.id] = newStudent;
    localStorage.setItem("campusflow_users", JSON.stringify(users));
    setUser(newStudent);
    localStorage.setItem("campusflow_user", JSON.stringify(newStudent));
    return {};
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem("campusflow_user");
  }, []);

  return { user, loading, signIn, signUp, signOut, isDemo: DEMO_MODE };
}

export { AuthContext };
