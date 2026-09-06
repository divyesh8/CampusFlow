import { NextResponse } from "next/server";
import { requireSession } from "@/server/srm/session-manager";
import { synchronizeStudent } from "@/server/srm/sync-service";
import { checkOrigin, rateLimit, routeError } from "@/server/srm/request-security";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const session = await requireSession();
    await rateLimit(`sync:${session.userId}`, 5);
    const result = await synchronizeStudent();
    return NextResponse.json(result, { status: result.srmStatus === "expired" ? 401 : result.status === "failed" ? 502 : 200,
      headers: { "Cache-Control": "no-store" } });
  } catch (error) { return routeError(error); }
}

