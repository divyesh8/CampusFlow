import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { StudentProfile } from "@/types";

interface AuthContextType {
  user: StudentProfile | null;
  loading: boolean;
  signIn: (netId: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  lastSyncAt: string | null;
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
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    // Check server-side session on mount
    fetch("/api/srm/session")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("No session");
      })
      .then((data) => {
        if (data.authenticated && data.profile) {
          setUser(data.profile);
          setLastSyncAt(data.lastSyncAt || null);
        }
      })
      .catch(() => {
        // No valid session
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signIn = useCallback(async (netId: string, password: string) => {
    try {
      const res = await fetch("/api/srm/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ netId, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        return { error: data.error || "Authentication failed." };
      }

      if (data.profile) {
        setUser(data.profile);
      }
      return {};
    } catch {
      return { error: "Network error. Please check your connection." };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/srm/session", { method: "DELETE" });
    } catch {
      // Ignore errors on sign out
    }
    setUser(null);
    setLastSyncAt(null);
  }, []);

  return { user, loading, signIn, signOut, lastSyncAt };
}

export { AuthContext };
