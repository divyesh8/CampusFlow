import { createClient } from "@/lib/supabase/server";
import type { StudentProfile } from "@/types";
import { getAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow } from "@/lib/supabase/database.types";
import type { NormalizedProfile } from "@/server/srm/normalized-data";

function mapProfile(data: ProfileRow): StudentProfile {
  return { id: data.id, userId: data.id, universityId: data.university_id ?? "",
    campusId: data.campus_id ?? undefined, studentId: data.student_id ?? "", netId: data.net_id ?? undefined,
    name: data.name, email: data.email, phone: data.phone ?? undefined,
    program: data.program, department: data.department, year: data.year, semester: data.semester,
    section: data.section ?? undefined, batch: data.batch, attendanceThreshold: data.attendance_threshold ?? 75,
    onboarded: data.onboarded, createdAt: data.created_at, updatedAt: data.updated_at };
}

export const profileRepository = {
  // Internal session resolver: the caller obtains this UUID from a hashed, unexpired session token.
  async getStored(userId: string) {
    const { data, error } = await getAdminClient().from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error("DATABASE_ERROR");
    return data ? mapProfile(data) : null;
  },
  async saveSRM(userId: string, netId: string, email: string, profile: NormalizedProfile) {
    const admin = getAdminClient();
    const { data: university, error: universityError } = await admin.from("universities")
      .select("id").eq("short_name", "SRM").single();
    if (universityError || !university) throw new Error("DATABASE_ERROR");
    const { data: existing, error: readError } = await admin.from("profiles").select("student_id,net_id").eq("id", userId).maybeSingle();
    if (readError) throw new Error("DATABASE_ERROR");
    if (existing?.net_id && existing.student_id !== profile.regNumber) throw new Error("SRM_IDENTITY_MISMATCH");
    const { data, error } = await admin.from("profiles").upsert({ id: userId, university_id: university.id,
      student_id: profile.regNumber, net_id: netId, name: profile.name, email,
      phone: profile.mobile, program: profile.program, department: profile.department,
      year: null, semester: profile.semester, section: profile.section, batch: profile.batch,
      onboarded: true, last_synced_at: new Date().toISOString(),
    }, { onConflict: "id" }).select("*").single();
    if (error || !data) throw new Error("DATABASE_ERROR");
    return mapProfile(data);
  },
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

    return mapProfile(data);
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
