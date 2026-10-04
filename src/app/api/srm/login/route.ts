import { z } from "zod";
import { login } from "@/server/student-portal/auth";
import { PortalError } from "@/server/student-portal/errors";
import { cookieId, failure, guard, json, loginSchema, rateLimit, readJson, setCookie } from "@/server/student-portal/security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let input: z.infer<typeof loginSchema> | undefined;
  try {
    guard(request, "login");
    input = await readJson(request, loginSchema);
    if (input.sessionId !== await cookieId()) throw new PortalError("SESSION_EXPIRED", 401);
    rateLimit(`account:${input.netId.toLowerCase()}`, 6);
    const result = await login(input);
    await setCookie(result.sessionId);
    return json({ authenticated: true, profile: result.profile, lastSyncAt: result.lastSyncAt });
  } catch (error) { return failure(error); }
  finally { if (input) { input.password = ""; input.captcha = ""; } }
}
