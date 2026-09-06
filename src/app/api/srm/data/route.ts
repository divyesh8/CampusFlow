import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/server/srm/session-manager";
import { routeError } from "@/server/srm/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const admin = getAdminClient();
    const [subjects, snapshots, marks, components, logs] = await Promise.all([
      admin.from("subjects").select("id,name,code,credits,srm_faculty,srm_slot,srm_room,srm_academic_year").eq("srm_owner_id", session.userId),
      admin.from("attendance_snapshots").select("subject_id,attended,conducted,percentage,date").eq("user_id", session.userId).eq("source", "srm").order("date", { ascending: false }),
      admin.from("marks").select("id,subject_id,assessment_id,marks_obtained,max_marks,absent,assessments(name,type,weightage),subjects!inner(name,code)").eq("user_id", session.userId),
      admin.from("srm_sync_components").select("component,last_synced_at,last_error").eq("user_id", session.userId),
      admin.from("sync_logs").select("status,started_at,completed_at,error_message,details").eq("user_id", session.userId).eq("provider", "srm").order("started_at", { ascending: false }).limit(1),
    ]);
    if ([subjects, snapshots, marks, components, logs].some((result) => result.error)) throw new Error("DATABASE_ERROR");
    return NextResponse.json({ subjects: subjects.data ?? [], attendance: snapshots.data ?? [], marks: marks.data ?? [], components: components.data ?? [], lastSync: logs.data?.[0] ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return routeError(error); }
}
