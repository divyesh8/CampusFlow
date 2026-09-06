import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/server/srm/session-manager";
import { checkOrigin, routeError } from "@/server/srm/request-security";
export const runtime = "nodejs";
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ authenticated: true, profile: session.studentProfile,
      lastSyncAt: session.lastSyncAt, srmStatus: session.srmStatus }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return routeError(error); }
}
export async function DELETE(request: Request) {
  try { checkOrigin(request); await destroySession(); return NextResponse.json({ success: true }); }
  catch (error) { return routeError(error); }
}

