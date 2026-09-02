import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { StudentProfile } from "@/types";

interface AuthContextType {
  user: StudentProfile | null;
  loading: boolean;
  signIn: (netId: string, password: string) => Promise<{
    error?: string;
    requiresCaptcha?: boolean;
    captchaImage?: string;
    captchaDigest?: string;
    challengeId?: string;
  }>;
  signInWithCaptcha: (
    netId: string,
    password: string,
    captchaDigest: string,
    captchaAnswer: string,
    challengeId?: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  lastSyncAt: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

const AUTH_TIMEOUT_MS = 35_000;

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
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
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signIn = useCallback(async (netId: string, password: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/srm/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ netId, password }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (data.status === "verification_required") {
        return {
          error: data.error || "Verification required",
          requiresCaptcha: true,
          captchaImage: data.captchaImage,
          captchaDigest: data.captchaDigest,
          challengeId: data.challengeId,
        };
      }

      if (!res.ok || data.error) {
        return { error: data.error || "Authentication failed." };
      }

      if (data.profile) {
        setUser(data.profile);
      }
      return {};
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return {
          error:
            "SRM authentication timed out. Please try again.",
        };
      }
      return { error: "Network error. Please check your connection." };
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const signInWithCaptcha = useCallback(
    async (
      netId: string,
      password: string,
      captchaDigest: string,
      captchaAnswer: string,
      challengeId?: string
    ) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

      try {
        if (challengeId) {
          const res = await fetch("/api/srm/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              challengeId,
              captchaAnswer,
              password,
            }),
            signal: controller.signal,
          });

          const data = await res.json();

          if (!res.ok || data.error) {
            return { error: data.error || "Authentication failed." };
          }

          if (data.profile) {
            setUser(data.profile);
          }
          return {};
        }

        const res = await fetch("/api/srm/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            netId,
            password,
            captchaDigest,
            captchaAnswer,
          }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          return { error: data.error || "Authentication failed." };
        }

        if (data.profile) {
          setUser(data.profile);
        }
        return {};
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return {
            error:
              "SRM authentication timed out. Please try again.",
          };
        }
        return { error: "Network error. Please check your connection." };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/srm/session", { method: "DELETE" });
    } catch {}
    setUser(null);
    setLastSyncAt(null);
  }, []);

  return {
    user,
    loading,
    signIn,
    signInWithCaptcha,
    signOut,
    lastSyncAt,
  };
}

export { AuthContext };
