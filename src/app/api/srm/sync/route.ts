import { sessions } from "@/server/student-portal/session-manager";
import { syncAcademicData } from "@/server/student-portal/scraper";
import { PortalError } from "@/server/student-portal/errors";
import { cookieId, failure, guard, json, rateLimit, setCookie } from "@/server/student-portal/security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let id: string | undefined;
  try {
    guard(request, "sync");
    id = await cookieId();
    rateLimit(`sync:${id}`, 5);
    const result = await sessions.run(id, async session => {
      if (!session.authenticated) throw new PortalError("SESSION_EXPIRED", 401);
      await syncAcademicData(session);
      return session.data;
    });
    await setCookie(id);
    return json(result);
  } catch (error) {
    if (id && !(error instanceof PortalError && ["RATE_LIMITED", "SESSION_BUSY"].includes(error.code))) await sessions.destroy(id);
    return failure(error);
  }
}
