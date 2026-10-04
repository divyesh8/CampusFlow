import { z } from "zod";
import { PortalDiagnostics } from "@/server/student-portal/diagnostics";
import { login } from "@/server/student-portal/auth";
import { PortalError } from "@/server/student-portal/errors";
import { cookieId, failure, guard, json, loginSchema, rateLimit, readJson, setCookie } from "@/server/student-portal/security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const diagnostics = new PortalDiagnostics();
  diagnostics.stage("PORTAL_REQUEST_START");
  let input: z.infer<typeof loginSchema> | undefined;
  try {
    guard(request, "login");
    input = await readJson(request, loginSchema);
    if (input.sessionId !== await cookieId()) throw new PortalError("SESSION_EXPIRED", 401);
    rateLimit(`account:${input.netId.toLowerCase()}`, 6);
    const result = await login(input, diagnostics);
    await setCookie(result.sessionId);
    return json({ authenticated: true, profile: result.profile, lastSyncAt: result.lastSyncAt }, 200, diagnostics);
  } catch (error) { return failure(error, diagnostics); }
  finally { if (input) { input.password = ""; input.captcha = ""; } }
}
