import { createClient } from "@/lib/supabase/server";
import type { SubjectAttendance, AttendanceRecord } from "@/types";

export const attendanceRepository = {
  async getSubjectAttendance(userId: string): Promise<SubjectAttendance[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return [];

    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("subject_id, date, status")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error || !records) return [];

    const subjectMap = new Map<string, { attended: number; conducted: number }>();

    for (const record of records) {
      const existing = subjectMap.get(record.subject_id) || { attended: 0, conducted: 0 };
      if (record.status === "present" || record.status === "extra") {
        existing.attended++;
      }
      if (record.status !== "cancelled") {
        existing.conducted++;
      }
      subjectMap.set(record.subject_id, existing);
    }

    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name, code");

    const subjectLookup = new Map((subjects || []).map((s) => [s.id, { name: s.name, code: s.code }]));

    return Array.from(subjectMap.entries()).map(([subjectId, { attended, conducted }]) => {
      const subject = subjectLookup.get(subjectId);
      const percentage = conducted === 0 ? 0 : Math.round((attended / conducted) * 1000) / 10;
      return {
        subjectId,
        subjectName: subject?.name || "",
        subjectCode: subject?.code || "",
        attended,
        conducted,
        percentage,
        status: "safe" as const,
        canBunk: 0,
        mustAttend: 0,
      };
    });
  },

  async getRecords(userId: string, subjectId?: string): Promise<AttendanceRecord[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return [];

    let query = supabase
      .from("attendance_records")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((r) => ({
      id: r.id,
      studentId: r.user_id,
      subjectId: r.subject_id,
      date: r.date,
      status: r.status,
      source: r.source,
    }));
  },

  async insert(userId: string, record: { subjectId: string; date: string; status: string; source?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("attendance_records")
      .upsert(
        {
          user_id: userId,
          subject_id: record.subjectId,
          date: record.date,
          status: record.status,
          source: record.source || "manual",
        },
        { onConflict: "user_id,subject_id,date" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(userId: string, recordId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("id", recordId)
      .eq("user_id", userId);

    if (error) throw error;
  },
};
