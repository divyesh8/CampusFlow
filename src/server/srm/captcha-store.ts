import "server-only";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "./encryption";
import type { SRMCookieJar } from "./academia-config";

const CHALLENGE_COOKIE = "cf_challenge";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export async function createChallenge(netId: string, srmCookies: SRMCookieJar, captchaDigest: string, captchaImage: string) {
  const challengeId = randomBytes(16).toString("hex");
  const { error } = await getAdminClient().from("srm_auth_challenges").insert({
    challenge_token_hash: hash(challengeId), net_id: netId, encrypted_cookie_state: encrypt(srmCookies),
    captcha_digest: captchaDigest, captcha_url: captchaImage,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });
  if (error) throw new Error("SESSION_STORE_ERROR");
  (await cookies()).set(CHALLENGE_COOKIE, challengeId, { httpOnly: true, sameSite: "strict",
    secure: process.env.NODE_ENV === "production", path: "/api/srm/auth", maxAge: 300 });
  return { challengeId };
}
export async function getChallenge(challengeId: string, consume = false) {
  if (!/^[a-f0-9]{32}$/.test(challengeId) || (await cookies()).get(CHALLENGE_COOKIE)?.value !== challengeId) return null;
  const admin = getAdminClient();
  // DELETE ... RETURNING atomically claims a challenge for one verification attempt.
  const query = consume ? admin.from("srm_auth_challenges").delete() : admin.from("srm_auth_challenges").select("*");
  const { data, error } = await query.eq("challenge_token_hash", hash(challengeId))
    .gt("expires_at", new Date().toISOString()).select("*").maybeSingle();
  if (error) throw new Error("SESSION_STORE_ERROR");
  if (!data) return null;
  return { challengeId, netId: data.net_id, captchaDigest: data.captcha_digest, captchaImage: data.captcha_url,
    srmCookies: z.record(z.string(), z.string()).parse(decrypt(data.encrypted_cookie_state)) };
}
export async function updateChallengeCookies(challengeId: string, srmCookies: SRMCookieJar) {
  const { error } = await getAdminClient().from("srm_auth_challenges")
    .update({ encrypted_cookie_state: encrypt(srmCookies) }).eq("challenge_token_hash", hash(challengeId));
  if (error) throw new Error("SESSION_STORE_ERROR");
}

