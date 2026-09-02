import { createClient } from "@/lib/supabase/server";
import type { TimetableEntry } from "@/types";

export const timetableRepository = {
  async getEntries(userId: string): Promise<TimetableEntry[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return [];

    const { data: timetable, error: ttError } = await supabase
      .from("timetables")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (ttError || !timetable) return [];

    const { data: entries, error } = await supabase
      .from("timetable_entries")
      .select(`
        id,
        subject_id,
        day_of_week,
        start_time,
        end_time,
        room,
        building,
        faculty,
        type,
        subjects (name, code)
      `)
      .eq("timetable_id", timetable.id)
      .order("day_of_week")
      .order("start_time");

    if (error || !entries) return [];

    return entries.map((e) => {
      const subject = Array.isArray(e.subjects) ? e.subjects[0] : e.subjects;
      return {
        id: e.id,
        subjectId: e.subject_id,
        subjectName: subject?.name || "",
        subjectCode: subject?.code || "",
        dayOfWeek: e.day_of_week,
        startTime: e.start_time?.substring(0, 5) || "",
        endTime: e.end_time?.substring(0, 5) || "",
        room: e.room || undefined,
        building: e.building || undefined,
        faculty: e.faculty || undefined,
        type: e.type,
      };
    });
  },

  async getOverrides(userId: string, entryId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("timetable_overrides")
      .select("*")
      .eq("original_entry_id", entryId);

    if (error || !data) return [];
    return data;
  },

  async createEntry(userId: string, entry: {
    subjectId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
    building?: string;
    faculty?: string;
    type?: string;
  }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { data: timetable } = await supabase
      .from("timetables")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!timetable) throw new Error("No active timetable found");

    const { data, error } = await supabase
      .from("timetable_entries")
      .insert({
        timetable_id: timetable.id,
        subject_id: entry.subjectId,
        day_of_week: entry.dayOfWeek,
        start_time: entry.startTime,
        end_time: entry.endTime,
        room: entry.room || null,
        building: entry.building || null,
        faculty: entry.faculty || null,
        type: entry.type || "class",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEntry(userId: string, entryId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { data: timetable } = await supabase
      .from("timetables")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!timetable) throw new Error("No active timetable found");

    const { error } = await supabase
      .from("timetable_entries")
      .delete()
      .eq("id", entryId)
      .eq("timetable_id", timetable.id);

    if (error) throw error;
  },
};
