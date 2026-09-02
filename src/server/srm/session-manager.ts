import { cookies } from "next/headers";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "crypto";
import type { StudentProfile } from "@/types";
import type { SRMCookieJar } from "./academia-config";

const SESSION_COOKIE = "cf_session";
const SESSION_MAX_AGE = 60 * 60 * 24;

const SESSION_KEY = process.env.SRM_SESSION_KEY;
function getKey(): Buffer {
  if (!SESSION_KEY || SESSION_KEY.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SRM_SESSION_KEY must be set to a secure key (at least 32 chars) in production"
      );
    }
    console.warn(
      "[Session] WARNING: Using development fallback key. Set SRM_SESSION_KEY in production."
    );
    const fallback = "campusflow-dev-key-not-for-production-use!!";
    return Buffer.from(fallback, "utf8").subarray(0, 32);
  }
  const key = Buffer.alloc(32);
  Buffer.from(SESSION_KEY, "utf8").copy(key);
  return key;
}

function encrypt(data: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decrypt(data: string): string {
  const key = getKey();
  const [ivHex, authTagHex, encrypted] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

interface ServerSession {
  sessionId: string;
  userId: string;
  netId: string;
  email: string;
  studentProfile: StudentProfile;
  srmCookies: SRMCookieJar;
  createdAt: string;
  lastSyncAt?: string;
}

const sessionStore = new Map<string, ServerSession>();

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [key, session] of sessionStore) {
    const age = now - new Date(session.createdAt).getTime();
    if (age > SESSION_MAX_AGE * 1000) {
      sessionStore.delete(key);
    }
  }
}

setInterval(cleanupExpiredSessions, 60_000).unref?.();

export interface CampusFlowSession {
  userId: string;
  netId: string;
  email: string;
  studentProfile: StudentProfile;
  createdAt: string;
  lastSyncAt?: string;
}

export async function createSession(
  profile: StudentProfile,
  srmCookies: SRMCookieJar
): Promise<string> {
  const sessionId = generateSessionId();
  const cookieStore = await cookies();

  const serverSession: ServerSession = {
    sessionId,
    userId: profile.userId,
    netId: profile.studentId,
    email: profile.email,
    studentProfile: profile,
    srmCookies,
    createdAt: new Date().toISOString(),
  };

  sessionStore.set(sessionId, serverSession);

  const opaqueToken = generateSessionId();
  const encrypted = encrypt(opaqueToken);

  cookieStore.set(SESSION_COOKIE, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  sessionStore.set(`token:${opaqueToken}`, serverSession);

  console.log(`[Session] Created session for ${profile.studentId}`);
  return sessionId;
}

async function resolveSessionFromCookie(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const opaqueToken = decrypt(raw);
    const session = sessionStore.get(`token:${opaqueToken}`);
    if (!session) return null;

    const age = Date.now() - new Date(session.createdAt).getTime();
    if (age > SESSION_MAX_AGE * 1000) {
      sessionStore.delete(`token:${opaqueToken}`);
      sessionStore.delete(session.sessionId);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<CampusFlowSession | null> {
  const session = await resolveSessionFromCookie();
  if (!session) return null;

  return {
    userId: session.userId,
    netId: session.netId,
    email: session.email,
    studentProfile: session.studentProfile,
    createdAt: session.createdAt,
    lastSyncAt: session.lastSyncAt,
  };
}

export async function getSRMCookies(): Promise<SRMCookieJar | null> {
  const session = await resolveSessionFromCookie();
  if (!session) return null;
  return { ...session.srmCookies };
}

export async function updateSession(
  updates: Partial<CampusFlowSession>
): Promise<void> {
  const session = await resolveSessionFromCookie();
  if (!session) return;

  if (updates.studentProfile) {
    session.studentProfile = updates.studentProfile;
  }
  if (updates.lastSyncAt) {
    session.lastSyncAt = updates.lastSyncAt;
  }
  if (updates.userId) session.userId = updates.userId;
  if (updates.netId) session.netId = updates.netId;
  if (updates.email) session.email = updates.email;

  sessionStore.set(session.sessionId, session);

  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (raw) {
    try {
      const opaqueToken = decrypt(raw);
      sessionStore.set(`token:${opaqueToken}`, session);
    } catch {
      // Corrupted cookie, ignore
    }
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (raw) {
    try {
      const opaqueToken = decrypt(raw);
      const session = sessionStore.get(`token:${opaqueToken}`);
      if (session) {
        sessionStore.delete(session.sessionId);
      }
      sessionStore.delete(`token:${opaqueToken}`);
    } catch {
      // Ignore
    }
  }

  cookieStore.delete(SESSION_COOKIE);
  console.log("[Session] Session destroyed");
}

export async function requireSession(): Promise<CampusFlowSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
