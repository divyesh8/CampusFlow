import { createClient } from "@/lib/supabase/server";
import type { Exam } from "@/types";

export const examRepository = {
  async getAll(userId: string): Promise<Exam[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return [];

    const { data, error } = await supabase
      .from("exams")
      .select(`
        id,
        name,
        date,
        start_time,
        end_time,
        room,
        building,
        type,
        preparation_status,
        subject_id,
        subjects (name, code)
      `)
      .eq("user_id", userId)
      .order("date");

    if (error || !data) return [];

    return data.map((e) => {
      const subject = Array.isArray(e.subjects) ? e.subjects[0] : e.subjects;
      return {
        id: e.id,
        subjectId: e.subject_id,
        subjectName: subject?.name || "",
        subjectCode: subject?.code || "",
        name: e.name,
        date: e.date,
        startTime: e.start_time?.substring(0, 5) || "",
        endTime: e.end_time?.substring(0, 5) || "",
        room: e.room || undefined,
        building: e.building || undefined,
        type: e.type,
        preparationStatus: e.preparation_status,
      };
    });
  },

  async insert(userId: string, exam: {
    subjectId: string;
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    room?: string;
    building?: string;
    type: string;
  }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("exams")
      .insert({
        user_id: userId,
        subject_id: exam.subjectId,
        name: exam.name,
        date: exam.date,
        start_time: exam.startTime,
        end_time: exam.endTime,
        room: exam.room || null,
        building: exam.building || null,
        type: exam.type,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId: string, examId: string, updates: { preparationStatus?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("exams")
      .update({ preparation_status: updates.preparationStatus })
      .eq("id", examId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(userId: string, examId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", examId)
      .eq("user_id", userId);

    if (error) throw error;
  },
};
