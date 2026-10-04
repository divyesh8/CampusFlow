import { sessions } from "@/server/student-portal/session-manager";
import { PortalError } from "@/server/student-portal/errors";
import { cookieId, failure, json, setCookie } from "@/server/student-portal/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const id = await cookieId();
    const session = await sessions.get(id);
    if (!session.authenticated || !session.data) throw new PortalError("SESSION_EXPIRED", 401);
    await setCookie(id);
    return json(session.data);
  } catch (error) { return failure(error); }
}
