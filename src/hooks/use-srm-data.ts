"use client";

import { useEffect, useState } from "react";

export interface SrmData {
  subjects: { id: string; name: string; code: string; credits: number | null; srm_faculty: string | null; srm_slot: string | null; srm_room: string | null; srm_academic_year: string | null }[];
  attendance: { subject_id: string; attended: number; conducted: number; percentage: number; date: string }[];
  marks: { id: string; subject_id: string; assessment_id: string; marks_obtained: number | null; max_marks: number; absent: boolean; assessments: { name: string; type: string | null; weightage: number | null } | { name: string; type: string | null; weightage: number | null }[] | null; subjects: { name: string; code: string } | { name: string; code: string }[] }[];
  components: { component: string; last_synced_at: string | null; last_error: string | null }[];
  lastSync: { status: string; completed_at: string | null; error_message: string | null } | null;
}

export function useSrmData() {
  const [data, setData] = useState<SrmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/srm/data", { cache: "no-store" }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Academic data is unavailable.");
      return body as SrmData;
    }).then(setData).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Academic data is unavailable.")).finally(() => setLoading(false));
  }, []);
  return { data, loading, error };
}

export function latestAttendance(data: SrmData) {
  const latest = new Map<string, SrmData["attendance"][number]>();
  for (const row of data.attendance) if (!latest.has(row.subject_id)) latest.set(row.subject_id, row);
  return latest;
}
