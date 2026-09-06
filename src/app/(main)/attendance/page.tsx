"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSrmData, latestAttendance } from "@/hooks/use-srm-data";

export default function AttendancePage() {
  const { data, loading, error } = useSrmData();
  const latest = data ? latestAttendance(data) : new Map();
  return <div className="space-y-6"><div><h1 className="text-xl font-bold">Attendance</h1><p className="text-xs text-muted-foreground mt-1">Latest SRM attendance snapshots</p></div>
    {loading && <p className="text-sm text-muted-foreground">Loading synchronized data…</p>}
    {error && <Card><CardContent className="p-4 text-sm text-muted-foreground">{error} Sync after reconnecting SRM.</CardContent></Card>}
    {!loading && !error && data && latest.size === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No attendance has been published by SRM yet.</CardContent></Card>}
    <div className="space-y-3">{data && [...latest.entries()].map(([id, row]) => { const subject = data.subjects.find((item) => item.id === id); return <Card key={id}><CardContent className="p-4"><div className="flex justify-between gap-3"><div><p className="font-medium">{subject?.name || "Subject"}</p><p className="text-xs text-muted-foreground">{subject?.code || ""} · {row.attended}/{row.conducted} attended</p></div><p className="text-lg font-bold">{Number(row.percentage).toFixed(1)}%</p></div></CardContent></Card>; })}</div>
  </div>;
}
