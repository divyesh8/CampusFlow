import { createClient } from "@/lib/supabase/server";
import type { StudentProfile } from "@/types";

export const profileRepository = {
  async get(userId: string): Promise<StudentProfile | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.id,
      universityId: data.university_id || "",
      campusId: data.campus_id || undefined,
      studentId: data.student_id || "",
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      program: data.program || "",
      department: data.department || "",
      year: data.year || 1,
      semester: data.semester || 1,
      section: data.section || undefined,
      attendanceThreshold: data.attendance_threshold || 75,
      avatarUrl: data.avatar_url || undefined,
      onboarded: data.onboarded || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async upsert(profile: Partial<StudentProfile> & { id: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== profile.id) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: profile.id,
          university_id: profile.universityId,
          campus_id: profile.campusId || null,
          student_id: profile.studentId,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || null,
          program: profile.program,
          department: profile.department,
          year: profile.year,
          semester: profile.semester,
          section: profile.section || null,
          attendance_threshold: profile.attendanceThreshold,
          avatar_url: profile.avatarUrl || null,
          onboarded: profile.onboarded ?? false,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId: string, updates: Partial<StudentProfile>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const dbUpdates: Record<string, unknown> = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.program !== undefined) dbUpdates.program = updates.program;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.year !== undefined) dbUpdates.year = updates.year;
    if (updates.semester !== undefined) dbUpdates.semester = updates.semester;
    if (updates.section !== undefined) dbUpdates.section = updates.section;
    if (updates.attendanceThreshold !== undefined) dbUpdates.attendance_threshold = updates.attendanceThreshold;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.onboarded !== undefined) dbUpdates.onboarded = updates.onboarded;

    const { data, error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
