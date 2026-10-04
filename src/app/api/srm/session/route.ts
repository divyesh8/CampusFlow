import { createChallenge } from "@/server/student-portal/auth";
import { PortalDiagnostics } from "@/server/student-portal/diagnostics";
import { sessions } from "@/server/student-portal/session-manager";
import { checkOrigin, clearCookie, cookieId, cors, failure, guard, json, setCookie } from "@/server/student-portal/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const diagnostics = new PortalDiagnostics();
  diagnostics.stage("PORTAL_REQUEST_START");
  let created: string | undefined;
  try {
    guard(request, "create");
    const old = await cookieId().catch(() => undefined);
    if (old) await sessions.destroy(old);
    await clearCookie();
    const challenge = await createChallenge(diagnostics);
    created = challenge.sessionId;
    await setCookie(created);
    return json(challenge, 200, diagnostics);
  } catch (error) {
    if (created) await sessions.destroy(created);
    return failure(error, diagnostics);
  }
}
export async function GET() {
  try {
    const id = await cookieId();
    const session = await sessions.get(id);
    if (!session.authenticated) return json({ authenticated: false }, 401);
    await setCookie(id);
    return json({ authenticated: true, profile: session.profile, lastSyncAt: session.data?.lastSync?.completed_at });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const id = await cookieId().catch(() => undefined);
    if (id) await sessions.destroy(id);
    await clearCookie();
    return json({ success: true });
  } catch (error) { return failure(error); }
}
export async function OPTIONS(request: Request) { try { return cors(request); } catch (error) { return failure(error); } }
