import { NextResponse } from "next/server";
import {
  requireSession,
  getSRMCookies,
  updateSession,
} from "@/server/srm/session-manager";
import { syncAllData } from "@/server/srm/academia-service";

export async function POST() {
  try {
    const session = await requireSession();
    const srmCookies = await getSRMCookies();

    if (!srmCookies) {
      return NextResponse.json(
        {
          code: "SRM_SESSION_EXPIRED",
          error: "SRM connection expired. Please reconnect.",
        },
        { status: 401 }
      );
    }

    console.log("[SRM Sync] Starting sync for:", session.netId);

    const data = await syncAllData(srmCookies);

    const syncResult = {
      profile: !!session.studentProfile.name,
      attendance: data.attendance.length,
      marks: data.marks.length,
      courses: data.courses.length,
    };

    console.log("[SRM Sync] Sync completed:", syncResult);

    await updateSession({
      lastSyncAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      syncedItems: syncResult,
      data: {
        attendance: data.attendance,
        marks: data.marks,
        courses: data.courses,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { code: "SRM_SESSION_EXPIRED", error: "Session expired. Please reconnect." },
        { status: 401 }
      );
    }
    console.error("[SRM Sync] Error:", error);
    return NextResponse.json(
      { error: "Sync failed. Please try again." },
      { status: 500 }
    );
  }
}
