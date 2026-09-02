import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/server/srm/session-manager";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      netId: session.netId,
      email: session.email,
      profile: session.studentProfile,
      lastSyncAt: session.lastSyncAt,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to destroy session" }, { status: 500 });
  }
}
