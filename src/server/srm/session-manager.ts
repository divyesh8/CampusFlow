import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { getAdminClient } from "@/lib/supabase/admin";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { encrypt, decrypt } from "./encryption";
import { z } from "zod";
import type { StudentProfile } from "@/types";
import type { SRMCookieJar } from "./academia-config";

const SESSION_COOKIE = "cf_session";
const SESSION_MAX_AGE = 60 * 60 * 24;
const stateSchema = z.object({ srmCookies: z.record(z.string(), z.string()) });
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export interface CampusFlowSession {
  userId: string; netId: string; email: string; studentProfile: StudentProfile;
  createdAt: string; lastSyncAt?: string; srmStatus: "active" | "expired";
}

export async function createSession(profile: StudentProfile, srmCookies: SRMCookieJar) {
  const store = await cookies();
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const { error } = await getAdminClient().from("srm_sessions").insert({
    session_token_hash: hash(token), user_id: profile.userId, net_id: profile.netId,
    email: profile.email, encrypted_srm_state: encrypt({ srmCookies }), encrypted_profile: encrypt(profile),
    expires_at: new Date(now.getTime() + SESSION_MAX_AGE * 1000).toISOString(),
  });
  if (error) throw new Error("SESSION_STORE_ERROR");
  const old = store.get(SESSION_COOKIE)?.value;
  if (old) {
    const { error: rotationError } = await getAdminClient().from("srm_sessions").delete().eq("session_token_hash", hash(old));
    if (rotationError) throw new Error("SESSION_STORE_ERROR");
  }
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: SESSION_MAX_AGE, path: "/" });
}

async function resolve() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { data, error } = await getAdminClient().from("srm_sessions").select("*")
    .eq("session_token_hash", hash(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("SESSION_STORE_ERROR");
  if (!data || !z.uuid().safeParse(data.user_id).success) return null; // Old synthetic identities must reconnect.
  return data;
}
export async function getSession(): Promise<CampusFlowSession | null> {
  const stored = await resolve();
  if (!stored) return null;
  const profile = await profileRepository.getStored(stored.user_id);
  if (!profile) return null;
  return { userId: stored.user_id, netId: stored.net_id, email: stored.email, studentProfile: profile,
    createdAt: stored.created_at, lastSyncAt: stored.last_synced_at ?? undefined, srmStatus: stored.srm_status };
}
export async function getSRMCookies(): Promise<SRMCookieJar | null> {
  const stored = await resolve();
  if (!stored || stored.srm_status === "expired") return null;
  try { return stateSchema.parse(decrypt(stored.encrypted_srm_state)).srmCookies; }
  catch { throw new Error("SESSION_STORE_ERROR"); }
}
export async function updateSession(updates: { lastSyncAt?: string; srmCookies?: SRMCookieJar; srmStatus?: "active" | "expired" }) {
  const stored = await resolve();
  if (!stored) throw new Error("UNAUTHORIZED");
  const { error } = await getAdminClient().from("srm_sessions").update({
    ...(updates.lastSyncAt ? { last_synced_at: updates.lastSyncAt } : {}),
    ...(updates.srmCookies ? { encrypted_srm_state: encrypt({ srmCookies: updates.srmCookies }) } : {}),
    ...(updates.srmStatus ? { srm_status: updates.srmStatus } : {}),
    last_used_at: new Date().toISOString(),
  }).eq("id", stored.id);
  if (error) throw new Error("SESSION_STORE_ERROR");
}
export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const { error } = await getAdminClient().from("srm_sessions").delete().eq("session_token_hash", hash(token));
    if (error) throw new Error("SESSION_STORE_ERROR");
  }
  store.delete(SESSION_COOKIE);
}
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

