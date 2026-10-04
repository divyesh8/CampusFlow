import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PortalError, messages } from "./errors";
import { sessionTtl } from "./config";

export const COOKIE = "cf_portal_session";
export const sessionIdSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const loginSchema = z.object({
  sessionId: sessionIdSchema,
  netId: z.string().trim().min(1).max(6).regex(/^[a-zA-Z0-9]+$/),
  password: z.string().min(1).max(256),
  captcha: z.string().trim().min(1).max(8).regex(/^[a-zA-Z0-9]+$/),
}).strict();

function frontendOrigin() {
  try {
    const configured = process.env.FRONTEND_ORIGIN || (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
    const url = new URL(configured);
    if (url.origin !== configured || (process.env.NODE_ENV === "production" && url.protocol !== "https:")) throw new Error();
    return url.origin;
  } catch { throw new PortalError("CONFIGURATION_ERROR", 503); }
}
export function checkOrigin(request: Request) {
  if (request.headers.get("origin") !== frontendOrigin()) throw new PortalError("ORIGIN_REJECTED", 403);
}
export function cors(request: Request) {
  checkOrigin(request);
  return new NextResponse(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": frontendOrigin(), "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin", "Cache-Control": "no-store",
  } });
}
export function json(value: unknown, status = 200) {
  // Frontend and backend are deployed on the same origin. No wildcard CORS.
  return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store, private", "Pragma": "no-cache" } });
}
export function failure(error: unknown) {
  const known = error instanceof PortalError ? error : new PortalError("PORTAL_UNAVAILABLE");
  const response = json({ code: known.code, error: messages[known.code] }, known.status);
  if (known.status === 429) response.headers.set("Retry-After", "300");
  return response;
}
export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new PortalError("INVALID_REQUEST", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new PortalError("INVALID_REQUEST", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 4096) { await reader.cancel(); throw new PortalError("INVALID_REQUEST", 413); }
      chunks.push(chunk.value);
    }
    const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const result = schema.safeParse(input);
    if (!result.success) throw new PortalError("INVALID_REQUEST", 400);
    return result.data;
  } catch (error) {
    if (error instanceof PortalError) throw error;
    throw new PortalError("INVALID_REQUEST", 400);
  } finally {
    for (const chunk of chunks) chunk.fill(0);
    chunks.length = 0;
    reader.releaseLock();
  }
}
type Bucket = { count: number; expires: number };
const state = globalThis as typeof globalThis & { portalLimits?: Map<string, Bucket> };
const buckets = state.portalLimits ??= new Map();
export function rateLimit(key: string, limit: number, now = Date.now()) {
  for (const [id, value] of buckets) if (value.expires <= now) buckets.delete(id);
  const id = createHash("sha256").update(key).digest("hex");
  const bucket = buckets.get(id);
  if (bucket && bucket.count >= limit) throw new PortalError("RATE_LIMITED", 429);
  if (!bucket && buckets.size >= 2000) throw new PortalError("RATE_LIMITED", 429);
  buckets.set(id, { count: (bucket?.count ?? 0) + 1, expires: bucket?.expires ?? now + 300_000 });
}
export function guard(request: Request, operation: string) {
  checkOrigin(request);
  // Conservative process-wide cap: no trust in spoofable forwarding headers.
  rateLimit(`global:${operation}`, operation === "create" ? 30 : 60);
}
export async function cookieId() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!sessionIdSchema.safeParse(value).success) throw new PortalError("SESSION_EXPIRED", 401);
  return value!;
}
export async function setCookie(id: string) {
  (await cookies()).set(COOKIE, id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: Math.ceil(sessionTtl() / 1000) });
}
export async function clearCookie() { (await cookies()).delete(COOKIE); }
