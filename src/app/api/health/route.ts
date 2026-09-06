import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let database: "ok" | "error" = "error";
  try {
    const { error } = await getAdminClient().from("universities").select("id").limit(1);
    database = error ? "error" : "ok";
  } catch {
    database = "error";
  }
  return NextResponse.json({
    app: "ok",
    database,
    srmSessionKeyConfigured: Boolean(process.env.SRM_SESSION_KEY),
    timestamp: new Date().toISOString(),
  }, { status: database === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
