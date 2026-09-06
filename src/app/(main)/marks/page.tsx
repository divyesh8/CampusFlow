"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSrmData } from "@/hooks/use-srm-data";

export default function MarksPage() {
  const { data, loading, error } = useSrmData();
  return <div className="space-y-6"><div><h1 className="text-xl font-bold">Marks</h1><p className="text-xs text-muted-foreground mt-1">Assessments published by SRM</p></div>{loading && <p className="text-sm text-muted-foreground">Loading synchronized data…</p>}{error && <Card><CardContent className="p-4 text-sm text-muted-foreground">{error}</CardContent></Card>}{!loading && !error && data && data.marks.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No marks have been published by SRM yet.</CardContent></Card>}<div className="space-y-3">{data?.marks.map((mark) => { const subject = Array.isArray(mark.subjects) ? mark.subjects[0] : mark.subjects; const assessment = Array.isArray(mark.assessments) ? mark.assessments[0] : mark.assessments; return <Card key={mark.id}><CardContent className="p-4"><div className="flex justify-between gap-3"><div><p className="font-medium">{subject?.name || "Subject"}</p><p className="text-xs text-muted-foreground">{subject?.code || ""} · {assessment?.name || "Assessment"}</p></div><p className="font-bold">{mark.absent ? "Absent" : `${mark.marks_obtained ?? "—"}/${mark.max_marks}`}</p></div></CardContent></Card>; })}</div></div>;
}
