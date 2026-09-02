import { createClient } from "@/lib/supabase/server";
import type { UserPreferences } from "@/types";

export const preferenceRepository = {
  async get(userId: string): Promise<UserPreferences | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return null;

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;

    return {
      theme: data.theme,
      timezone: data.timezone,
      attendanceThreshold: data.attendance_threshold,
      notifications: {
        attendance: data.notify_attendance,
        marks: data.notify_marks,
        timetable: data.notify_timetable,
        exams: data.notify_exams,
        assignments: data.notify_assignments,
        events: data.notify_events,
      },
    };
  },

  async upsert(userId: string, prefs: Partial<UserPreferences>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const updates: Record<string, unknown> = { user_id: userId };

    if (prefs.theme !== undefined) updates.theme = prefs.theme;
    if (prefs.timezone !== undefined) updates.timezone = prefs.timezone;
    if (prefs.attendanceThreshold !== undefined) updates.attendance_threshold = prefs.attendanceThreshold;
    if (prefs.notifications) {
      if (prefs.notifications.attendance !== undefined) updates.notify_attendance = prefs.notifications.attendance;
      if (prefs.notifications.marks !== undefined) updates.notify_marks = prefs.notifications.marks;
      if (prefs.notifications.timetable !== undefined) updates.notify_timetable = prefs.notifications.timetable;
      if (prefs.notifications.exams !== undefined) updates.notify_exams = prefs.notifications.exams;
      if (prefs.notifications.assignments !== undefined) updates.notify_assignments = prefs.notifications.assignments;
      if (prefs.notifications.events !== undefined) updates.notify_events = prefs.notifications.events;
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(updates, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
