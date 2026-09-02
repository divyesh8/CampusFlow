import { createClient } from "@/lib/supabase/server";
import type { Assignment } from "@/types";

export const assignmentRepository = {
  async getAll(userId: string): Promise<Assignment[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return [];

    const { data, error } = await supabase
      .from("assignments")
      .select(`
        id,
        title,
        description,
        due_date,
        submission_link,
        status,
        priority,
        subject_id,
        subjects (name)
      `)
      .eq("user_id", userId)
      .order("due_date");

    if (error || !data) return [];

    return data.map((a) => {
      const subject = Array.isArray(a.subjects) ? a.subjects[0] : a.subjects;
      return {
        id: a.id,
        title: a.title,
        subjectId: a.subject_id,
        subjectName: subject?.name || "",
        description: a.description || undefined,
        dueDate: a.due_date,
        submissionLink: a.submission_link || undefined,
        status: a.status,
        priority: a.priority,
      };
    });
  },

  async insert(userId: string, assignment: {
    subjectId: string;
    title: string;
    description?: string;
    dueDate: string;
    submissionLink?: string;
    status?: string;
    priority?: string;
  }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        user_id: userId,
        subject_id: assignment.subjectId,
        title: assignment.title,
        description: assignment.description || null,
        due_date: assignment.dueDate,
        submission_link: assignment.submissionLink || null,
        status: assignment.status || "not_started",
        priority: assignment.priority || "medium",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId: string, assignmentId: string, updates: Partial<Assignment>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const dbUpdates: Record<string, unknown> = {};

    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;

    const { data, error } = await supabase
      .from("assignments")
      .update(dbUpdates)
      .eq("id", assignmentId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(userId: string, assignmentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId)
      .eq("user_id", userId);

    if (error) throw error;
  },
};
