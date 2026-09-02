import { cookies } from "next/headers";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import type { StudentProfile } from "@/types";
import type { SRMCookieJar } from "./academia-config";

const SESSION_COOKIE = "cf_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

const ENCRYPTION_KEY = process.env.SRM_SESSION_KEY || "campusflow-default-key-change-in-production!!";

function getKey(): Buffer {
  const key = Buffer.alloc(32);
  Buffer.from(ENCRYPTION_KEY).copy(key);
  return key;
}

function encrypt(data: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(data: string): string {
  const key = getKey();
  const [ivHex, encrypted] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

export interface SessionData {
  sessionId: string;
  userId: string;
  netId: string;
  email: string;
  studentProfile: StudentProfile;
  srmCookies: string;
  createdAt: string;
  lastSyncAt?: string;
}

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

  const sessionData: SessionData = {
    sessionId,
    userId: profile.userId,
    netId: profile.studentId,
    email: profile.email,
    studentProfile: profile,
    srmCookies: JSON.stringify(srmCookies),
    createdAt: new Date().toISOString(),
  };

  const encrypted = encrypt(JSON.stringify(sessionData));

  cookieStore.set(SESSION_COOKIE, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return sessionId;
}

export async function getSession(): Promise<CampusFlowSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const decrypted = decrypt(raw);
    const data = JSON.parse(decrypted) as SessionData;

    return {
      userId: data.userId,
      netId: data.netId,
      email: data.email,
      studentProfile: data.studentProfile,
      createdAt: data.createdAt,
      lastSyncAt: data.lastSyncAt,
    };
  } catch {
    return null;
  }
}

export async function getSRMCookies(): Promise<SRMCookieJar | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const decrypted = decrypt(raw);
    const data = JSON.parse(decrypted) as SessionData;
    return JSON.parse(data.srmCookies) as SRMCookieJar;
  } catch {
    return null;
  }
}

export async function updateSession(
  updates: Partial<CampusFlowSession>
): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return;

  try {
    const decrypted = decrypt(raw);
    const data = JSON.parse(decrypted) as SessionData;

    if (updates.studentProfile) {
      data.studentProfile = updates.studentProfile;
    }
    if (updates.lastSyncAt) {
      data.lastSyncAt = updates.lastSyncAt;
    }
    if (updates.userId) data.userId = updates.userId;
    if (updates.netId) data.netId = updates.netId;
    if (updates.email) data.email = updates.email;

    const encrypted = encrypt(JSON.stringify(data));
    cookieStore.set(SESSION_COOKIE, encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  } catch {
    // Session corrupted, ignore
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireSession(): Promise<CampusFlowSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
