"use client";
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { StudentProfile } from "@/types";

interface AuthContextType {
  user: StudentProfile | null;
  loading: boolean;
  connect: (input: { sessionId: string; netId: string; password: string; captcha: string }) => Promise<{ error?: string }>;
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
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/srm/session", { cache: "no-store", signal: AbortSignal.timeout(120_000) });
      if (!response.ok) {
        if (response.status === 401) { setUser(null); setLastSyncAt(null); }
        return;
      }
      const data = await response.json();
      if (data.authenticated && data.profile) { setUser(data.profile); setLastSyncAt(data.lastSyncAt || null); }
    } catch { /* Keep existing state on temporary connectivity failures. */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // This refresh updates state only after the asynchronous session request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const expired = () => { setUser(null); setLastSyncAt(null); };
    window.addEventListener("srm-session-expired", expired);
    window.addEventListener("srm-data-updated", refresh);
    return () => { window.removeEventListener("srm-session-expired", expired); window.removeEventListener("srm-data-updated", refresh); };
  }, [refresh]);
  const connect = useCallback(async (input: { sessionId: string; netId: string; password: string; captcha: string }) => {
    try {
      const pending = fetch("/api/srm/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input), signal: AbortSignal.timeout(65_000),
      });
      input.password = ""; input.captcha = "";
      const response = await pending;
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "SESSION_EXPIRED") { setUser(null); setLastSyncAt(null); }
        return { error: data.error || "Could not connect to SRM." };
      }
      setUser(data.profile); setLastSyncAt(data.lastSyncAt || null);
      return {};
    } catch { return { error: "Could not reach SRM. Load a new CAPTCHA and try again." }; }
    finally { input.password = ""; input.captcha = ""; }
  }, []);
  const signOut = useCallback(async () => {
    try {
      const response = await fetch("/api/srm/session", { method: "DELETE" });
      if (!response.ok) throw new Error();
    } catch {
      // Clear local private data even if the server is temporarily unreachable.
      // The server session will expire automatically.
    }
    setUser(null); setLastSyncAt(null);
  }, []);
  return { user, loading, connect, signOut, lastSyncAt };
}
export { AuthContext };
