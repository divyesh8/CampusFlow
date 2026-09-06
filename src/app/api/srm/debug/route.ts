import { NextResponse } from "next/server";
import { SRMLoginService } from "@/server/srm/login-service";
import { routeError } from "@/server/srm/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production" || process.env.SRM_DEBUG_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const result = await new SRMLoginService().inspectLoginPage();
    return NextResponse.json({ ...result, cookieNames: result.cookieNames.length, inputNames: result.inputNames.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return routeError(error); }
}
