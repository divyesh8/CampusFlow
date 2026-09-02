import { createClient } from "@/lib/supabase/server";
import type { SubjectMarks } from "@/types";

export const marksRepository = {
  async getSubjectMarks(userId: string): Promise<SubjectMarks[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return [];

    const { data: marks, error } = await supabase
      .from("marks")
      .select(`
        id,
        marks_obtained,
        max_marks,
        assessment_id,
        subject_id,
        assessments (name, type, weightage),
        subjects (name, code)
      `)
      .eq("user_id", userId);

    if (error || !marks) return [];

    const grouped = new Map<string, {
      subjectName: string;
      subjectCode: string;
      assessments: SubjectMarks["assessments"];
    }>();

    for (const mark of marks) {
      const subjectId = mark.subject_id;
      const existing = grouped.get(subjectId);

      const assessment = Array.isArray(mark.assessments) ? mark.assessments[0] : mark.assessments;
      const subject = Array.isArray(mark.subjects) ? mark.subjects[0] : mark.subjects;

      if (!existing) {
        grouped.set(subjectId, {
          subjectName: subject?.name || "",
          subjectCode: subject?.code || "",
          assessments: [
            {
              assessmentId: mark.assessment_id,
              name: assessment?.name || "",
              type: assessment?.type || "",
              marksObtained: mark.marks_obtained,
              maxMarks: mark.max_marks,
              weightage: assessment?.weightage || 0,
            },
          ],
        });
      } else {
        existing.assessments.push({
          assessmentId: mark.assessment_id,
          name: assessment?.name || "",
          type: assessment?.type || "",
          marksObtained: mark.marks_obtained,
          maxMarks: mark.max_marks,
          weightage: assessment?.weightage || 0,
        });
      }
    }

    return Array.from(grouped.entries()).map(([subjectId, data]) => {
      const totalObtained = data.assessments.reduce((sum, a) => sum + a.marksObtained, 0);
      const totalMax = data.assessments.reduce((sum, a) => sum + a.maxMarks, 0);
      return {
        subjectId,
        subjectName: data.subjectName,
        subjectCode: data.subjectCode,
        assessments: data.assessments,
        totalObtained,
        totalMax,
        percentage: totalMax === 0 ? 0 : Math.round((totalObtained / totalMax) * 1000) / 10,
      };
    });
  },

  async insert(userId: string, mark: { subjectId: string; assessmentId: string; marksObtained: number; maxMarks: number }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("marks")
      .upsert(
        {
          user_id: userId,
          assessment_id: mark.assessmentId,
          subject_id: mark.subjectId,
          marks_obtained: mark.marksObtained,
          max_marks: mark.maxMarks,
        },
        { onConflict: "user_id,assessment_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(userId: string, markId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("marks")
      .delete()
      .eq("id", markId)
      .eq("user_id", userId);

    if (error) throw error;
  },
};
