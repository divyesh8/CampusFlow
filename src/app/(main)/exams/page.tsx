"use client";

import { DEMO_EXAMS } from "@/utils/demo-data";
import { daysUntil, formatTime } from "@/utils/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, BookOpen, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const prepStatusColors = {
  not_started: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  revising: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  ready: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const prepStatusLabels = {
  not_started: "Not Started",
  revising: "Revising",
  ready: "Ready",
};

export default function ExamsPage() {
  const upcoming = DEMO_EXAMS.filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = DEMO_EXAMS.filter((e) => new Date(e.date) < new Date());

  const nextExam = upcoming[0];
  const daysBetween = upcoming.length > 1
    ? Math.ceil((new Date(upcoming[1].date).getTime() - new Date(upcoming[0].date).getTime()) / 86400000)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exams</h1>
        <p className="text-muted-foreground mt-1">Your upcoming examination schedule</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Next Exam</p>
            {nextExam && (
              <>
                <p className="text-lg font-bold mt-1">{nextExam.subjectName.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground">{daysUntil(nextExam.date)} days</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Exams</p>
            <p className="text-2xl font-bold mt-1">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground">upcoming</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Days Between</p>
            <p className="text-2xl font-bold mt-1">{daysBetween}</p>
            <p className="text-xs text-muted-foreground">exams</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Subjects</p>
            <p className="text-2xl font-bold mt-1">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground">remaining</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {upcoming.map((exam) => {
            const days = daysUntil(exam.date);
            return (
              <Card key={exam.id} className={cn("border-border", days <= 3 && "border-amber-200 dark:border-amber-900")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">{exam.subjectName}</p>
                      <p className="text-xs text-muted-foreground">{exam.name}</p>
                    </div>
                    <Badge className={prepStatusColors[exam.preparationStatus]}>
                      {prepStatusLabels[exam.preparationStatus]}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(exam.date), "MMM d")} &middot; {formatTime(exam.startTime)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {exam.room}{exam.building ? `, ${exam.building}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant={days <= 3 ? "destructive" : days <= 7 ? "secondary" : "outline"} className="text-xs">
                      {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days remaining`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Exam Calendar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.map((exam) => (
                <div key={exam.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="text-center min-w-[40px]">
                    <p className="text-xs text-muted-foreground">{format(new Date(exam.date), "MMM")}</p>
                    <p className="text-lg font-bold">{format(new Date(exam.date), "d")}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{exam.subjectName}</p>
                    <p className="text-xs text-muted-foreground">{exam.name}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {formatTime(exam.startTime)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
