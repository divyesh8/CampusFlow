import "server-only";
import { getSRMCookies, requireSession, updateSession } from "./session-manager";
import { syncAllData } from "./academia-service";
import { srmRepository } from "@/lib/repositories/srm-repository";
import { classifySRMError } from "./error-codes";
import type { SyncComponent } from "./normalized-data";
import { RequestError } from "./request-security";

export async function synchronizeStudent() {
  const session = await requireSession();
  const syncId = await srmRepository.begin(session.userId);
  if (!syncId) throw new RequestError(409, "SYNC_IN_PROGRESS", "A synchronization is already running.");
  const start = Date.now();
  const counts: Record<string, number> = {};
  const errors: Record<string, string> = {};
  try {
    const cookies = await getSRMCookies();
    if (!cookies) throw new Error("SRM_SESSION_EXPIRED");
    const data = await syncAllData(cookies, session.studentProfile.studentId);
    Object.assign(errors, data.errors);
    for (const component of ["profile", "attendance", "marks", "courses"] as SyncComponent[]) {
      if (data[component] !== null && !errors[component]) {
        try { counts[component] = await srmRepository.save(session.userId, component, data[component]); }
        catch (error) { errors[component] = classifySRMError(error); }
      }
      if (errors[component]) await srmRepository.fail(session.userId, component, errors[component]);
      console.log(JSON.stringify({ syncId, stage: component, durationMs: Date.now() - start,
        status: errors[component] ? "failed" : "success", code: errors[component], records: counts[component] }));
    }
    const expired = Object.values(errors).includes("SRM_SESSION_EXPIRED");
    const status = Object.keys(errors).length === 0 ? "success" : Object.keys(counts).length ? "partial" : "failed";
    const syncedAt = new Date().toISOString();
    await updateSession({ srmCookies: data.cookies, srmStatus: expired ? "expired" : "active",
      ...(status === "success" ? { lastSyncAt: syncedAt } : {}) });
    await srmRepository.finish(session.userId, syncId, status, counts, errors);
    return { success: status === "success", status, syncId, syncedAt, syncedItems: counts, errors,
      srmStatus: expired ? "expired" : "active" };
  } catch (error) {
    const code = classifySRMError(error);
    if (code === "SRM_SESSION_EXPIRED") await updateSession({ srmStatus: "expired" });
    await srmRepository.finish(session.userId, syncId, "failed", counts, { ...errors, sync: code });
    throw error;
  }
}

