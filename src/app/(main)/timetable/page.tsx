"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSrmData } from "@/hooks/use-srm-data";

export default function TimetablePage() {
  const { data, loading, error } = useSrmData();
  return <div className="space-y-6"><div><h1 className="text-xl font-bold">Courses</h1><p className="text-xs text-muted-foreground mt-1">Course and slot information from SRM</p></div>{loading && <p className="text-sm text-muted-foreground">Loading synchronized data…</p>}{error && <Card><CardContent className="p-4 text-sm text-muted-foreground">{error}</CardContent></Card>}{!loading && !error && data && data.subjects.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No course information has been published by SRM yet.</CardContent></Card>}<div className="space-y-3">{data?.subjects.map((subject) => <Card key={subject.id}><CardContent className="p-4"><p className="font-medium">{subject.name}</p><p className="text-xs text-muted-foreground">{subject.code}{subject.srm_slot ? ` · Slot ${subject.srm_slot}` : ""}{subject.srm_room ? ` · ${subject.srm_room}` : ""}</p>{subject.srm_faculty && <p className="text-xs text-muted-foreground mt-1">{subject.srm_faculty}</p>}</CardContent></Card>)}</div></div>;
}
