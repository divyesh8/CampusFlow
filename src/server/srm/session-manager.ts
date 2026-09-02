import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { StudentProfile } from "@/types";

const SESSION_COOKIE = "cf_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export interface SessionData {
  userId: string;
  netId: string;
  email: string;
  studentProfile: StudentProfile;
  createdAt: string;
  lastSyncAt?: string;
}

export async function createSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64");
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(decoded) as SessionData;
  } catch {
    return null;
  }
}

export async function updateSession(updates: Partial<SessionData>): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await createSession({ ...session, ...updates });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component - ignore
          }
        },
      },
    }
  );
  const { data } = await supabase.auth.getUser();
  return data.user;
}
