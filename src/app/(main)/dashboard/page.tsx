"use client";

import { useAuth } from "@/hooks/use-auth";
import { DEMO_ATTENDANCE, DEMO_TIMETABLE, DEMO_EXAMS, DEMO_ASSIGNMENTS, DEMO_CAMPUS_EVENTS, DEMO_MESS, DEMO_MARKS } from "@/utils/demo-data";
import { getGreeting, formatDate, getNextClass, getTimeUntil, getAssignmentsDueToday, getChangesSinceLastVisit, calculateAttendancePercentage, getSubjectMarks } from "@/utils/calculations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  BookOpen,
  AlertTriangle,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  UtensilsCrossed,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { format, isToday } from "date-fns";

const statusColors = {
  safe: "bg-green-500/10 text-green-700 dark:text-green-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const statusLabels = {
  safe: "SAFE",
  warning: "WARNING",
  critical: "AT RISK",
};

export default function DashboardPage() {
  const { user } = useAuth();

  const nextClass = getNextClass(DEMO_TIMETABLE, []);
  const todayAssignments = getAssignmentsDueToday(DEMO_ASSIGNMENTS);
  const marks = getSubjectMarks(DEMO_MARKS);
  const totalAttended = DEMO_ATTENDANCE.reduce((s, a) => s + a.attended, 0);
  const totalConducted = DEMO_ATTENDANCE.reduce((s, a) => s + a.conducted, 0);
  const overallAttendance = calculateAttendancePercentage(totalAttended, totalConducted);
  const totalMarksObtained = marks.reduce((s, m) => s + m.totalObtained, 0);
  const totalMarksMax = marks.reduce((s, m) => s + m.totalMax, 0);
  const overallMarksPercentage = calculateAttendancePercentage(totalMarksObtained, totalMarksMax);
  const nextExam = DEMO_EXAMS[0];
  const todayClasses = DEMO_TIMETABLE.filter((e) => e.dayOfWeek === new Date().getDay() && e.type !== "break").length;
  const attendanceRisk = DEMO_ATTENDANCE.find((a) => a.status === "critical");

  const changes = getChangesSinceLastVisit(
    {
      marks: [{ subjectName: "Java Programming", old: 16, new: 18 }],
      attendance: [{ subjectName: "Computer Networks", old: 77, new: 70 }],
      timetable: ["Friday OS class moved to 12:30 PM"],
    },
    "2026-08-31"
  );

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Next Class */}
      {nextClass && (
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-stretch">
              <div className="w-1.5 bg-primary" />
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Next Class</p>
                    <h2 className="text-lg font-bold mt-1">{nextClass.subjectName}</h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {nextClass.startTime} – {nextClass.endTime}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Room: {nextClass.room} &middot; {nextClass.faculty}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    Starts in {getTimeUntil(nextClass.startTime)}
                  </Badge>
                </div>
                <Link href="/timetable">
                  <Button variant="ghost" size="sm" className="mt-3 gap-1 text-xs">
                    View timetable <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/attendance">
          <Card className="border-border hover:border-foreground/20 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Attendance</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColors[attendanceRisk?.status || "safe"]}`}>
                  {statusLabels[attendanceRisk?.status || "safe"]}
                </span>
              </div>
              <p className="text-2xl font-bold">{overallAttendance}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalAttended}/{totalConducted} classes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/marks">
          <Card className="border-border hover:border-foreground/20 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Marks</span>
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{totalMarksObtained}/{totalMarksMax}</p>
              <p className="text-xs text-muted-foreground mt-1">{overallMarksPercentage}%</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-border h-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Classes Today</span>
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{todayClasses}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.floor(todayClasses * 0.4)} completed
            </p>
          </CardContent>
        </Card>

        <Link href="/exams">
          <Card className="border-border hover:border-foreground/20 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Next Exam</span>
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {nextExam && (
                <>
                  <p className="text-lg font-bold leading-tight">{nextExam.subjectName.split(" ").slice(0, 2).join(" ")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.ceil((new Date(nextExam.date).getTime() - Date.now()) / 86400000)} days
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Attendance Risk */}
      {attendanceRisk && (
        <Card className="border-red-200 dark:border-red-900 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Attendance Risk</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {attendanceRisk.subjectName} attendance is {attendanceRisk.percentage}%. Attend the next {attendanceRisk.mustAttend} classes to reach {user?.attendanceThreshold || 75}%.
                </p>
                <Link href="/attendance">
                  <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs px-0">
                    View details <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Since Last Visit */}
      {changes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Since your last visit</h3>
          <div className="space-y-2">
            {changes.map((change, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      change.type === "marks" ? "bg-blue-500" :
                      change.type === "attendance" ? "bg-amber-500" :
                      "bg-purple-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{change.title}</p>
                      <p className="text-xs text-muted-foreground">{change.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Today Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Upcoming Assignments */}
        {todayAssignments.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Due Today</h3>
              <div className="space-y-2">
                {todayAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.subjectName}</p>
                    </div>
                    <Badge variant={a.priority === "high" ? "destructive" : "secondary"} className="text-[10px]">
                      {a.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mess Menu */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Mess Today</h3>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </div>
            {DEMO_MESS.meals.slice(0, 2).map((meal) => (
              <div key={meal.type} className="mb-2 last:mb-0">
                <p className="text-xs font-medium text-muted-foreground capitalize">{meal.type}</p>
                <p className="text-sm">{meal.items.join(", ")}</p>
              </div>
            ))}
            <Link href="/mess">
              <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs px-0">
                Full menu <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      {DEMO_CAMPUS_EVENTS.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Upcoming Events</h3>
            <Link href="/events">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEMO_CAMPUS_EVENTS.slice(0, 2).map((event) => (
              <Card key={event.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="text-[10px] mb-2 capitalize">
                        {event.category}
                      </Badge>
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(event.date), "MMM d")} &middot; {event.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
