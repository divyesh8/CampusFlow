import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types";

export const notificationRepository = {
  async getAll(userId: string): Promise<Notification[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return [];

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      category: n.category,
      read: n.read,
      actionUrl: n.action_url || undefined,
      createdAt: n.created_at,
    }));
  },

  async getUnreadCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return 0;

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) return 0;
    return count || 0;
  },

  async markAsRead(userId: string, notificationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
  },

  async create(userId: string, notification: {
    title: string;
    message: string;
    category: string;
    actionUrl?: string;
  }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        action_url: notification.actionUrl || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(userId: string, notificationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw error;
  },
};
