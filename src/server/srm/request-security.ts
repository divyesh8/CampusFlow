import "server-only";
import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/server/env";
import { classifySRMError, createErrorResponse } from "./error-codes";

export class RequestError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if (!origin || origin !== new URL(expected).origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new RequestError(403, "REQUEST_ORIGIN_REJECTED", "Request origin was rejected.");
  }
}
export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new RequestError(415, "INVALID_REQUEST", "Send application/json.");
  }
  const limit = 4096;
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > limit) { await reader.cancel(); throw new RequestError(413, "INVALID_REQUEST", "Request is too large."); }
      chunks.push(chunk.value);
    }
  }
  try {
    const parsed = schema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (parsed.success) return parsed.data;
  } catch { /* JSON parse failures are intentionally reduced to a safe client error. */ }
  throw new RequestError(400, "INVALID_REQUEST", "Check the required request fields.");
}
export async function rateLimit(key: string, limit = 8, window = 300) {
  getEnv();
  const { data, error } = await getAdminClient().rpc("consume_srm_rate_limit", {
    p_key: createHash("sha256").update(key).digest("hex"), p_limit: limit, p_window: window,
  });
  if (error) throw new Error("DATABASE_ERROR"); // Fail closed if shared limiting is unavailable.
  if (!data) throw new RequestError(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes.");
}
export async function guardAuth(request: Request) {
  checkOrigin(request);
  // Vercel overwrites this header. On other hosts use a conservative shared bucket.
  const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0] : "local";
  await rateLimit(`auth-ip:${ip || "unknown"}`, 20);
}
export function routeError(error: unknown, requestId: string = randomUUID()) {
  if (error instanceof RequestError) return NextResponse.json({ error: error.message, code: error.code, requestId },
    { status: error.status, headers: { "Cache-Control": "no-store", ...(error.status === 429 ? { "Retry-After": "300" } : {}) } });
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ code: "UNAUTHORIZED", error: "Please sign in again.", requestId }, { status: 401 });
  }
  const result = createErrorResponse(classifySRMError(error), requestId);
  return NextResponse.json(result.response, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
export const netIdSchema = z.string().trim().toLowerCase().max(100)
  .regex(/^[a-z0-9][a-z0-9._-]{1,63}(?:@srmist\.edu\.in)?$/)
  .transform((value) => value.replace(/@srmist\.edu\.in$/, ""));
export const passwordSchema = z.string().min(1).max(256);

