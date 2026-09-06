import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/server/srm/session-manager";
import type { Json } from "@/lib/supabase/database.types";
import type { SyncComponent, SyncData } from "@/server/srm/normalized-data";

export async function srmRepositoryClient(userId: string) {
  const session = await requireSession();
  if (session.userId !== userId) throw new Error("UNAUTHORIZED");
  return getAdminClient();
}
export const srmRepository = {
  async states(userId: string) {
    const admin = await srmRepositoryClient(userId);
    const { data, error } = await admin.from("srm_sync_components").select("*").eq("user_id", userId);
    if (error) throw new Error("DATABASE_ERROR");
    return data ?? [];
  },
  async begin(userId: string) {
    const admin = await srmRepositoryClient(userId);
    const { data, error } = await admin.rpc("begin_srm_sync", { p_user_id: userId });
    if (error) throw new Error("DATABASE_ERROR");
    return data;
  },
  async save(userId: string, component: SyncComponent, value: NonNullable<SyncData[SyncComponent]>) {
    const admin = await srmRepositoryClient(userId);
    const { data, error } = await admin.rpc("persist_srm_component", {
      p_user_id: userId, p_component: component, p_data: value as unknown as Json,
    });
    if (error) throw new Error("DATABASE_ERROR");
    return data;
  },
  async fail(userId: string, component: SyncComponent, code: string) {
    const admin = await srmRepositoryClient(userId);
    // Omitted columns preserve the last good record IDs and timestamp on conflict.
    const { error } = await admin.from("srm_sync_components").upsert({
      user_id: userId, component, last_error: code,
    }, { onConflict: "user_id,component" });
    if (error) throw new Error("DATABASE_ERROR");
  },
  async finish(userId: string, id: string, status: string, counts: Record<string, number>, errors: Record<string, string>) {
    const admin = await srmRepositoryClient(userId);
    const { error } = await admin.from("sync_logs").update({
      status, completed_at: new Date().toISOString(),
      records_updated: Object.values(counts).reduce((a, b) => a + b, 0),
      error_message: Object.keys(errors).length ? JSON.stringify(errors) : null,
      details: { counts, errors },
    }).eq("id", id).eq("user_id", userId);
    if (error) throw new Error("DATABASE_ERROR");
  },
};

