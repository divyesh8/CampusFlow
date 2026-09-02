"use client";

import { DEMO_ATTENDANCE, DEMO_MARKS } from "@/utils/demo-data";
import { getSubjectMarks, calculateAttendancePercentage, getAcademicStanding } from "@/utils/calculations";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BarChart3, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line } from "recharts";

const mockTrend = [
  { week: "W1", attendance: 88 },
  { week: "W2", attendance: 86 },
  { week: "W3", attendance: 84 },
  { week: "W4", attendance: 82 },
  { week: "W5", attendance: 81 },
  { week: "W6", attendance: 83 },
  { week: "W7", attendance: 82 },
  { week: "W8", attendance: 82 },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const subjects = getSubjectMarks(DEMO_MARKS);
  const standing = getAcademicStanding(DEMO_ATTENDANCE, 8, 16, subjects);

  const attChartData = DEMO_ATTENDANCE.map((a) => ({
    name: a.subjectCode,
    percentage: a.percentage,
    threshold: user?.attendanceThreshold || 75,
  }));

  const attColors = DEMO_ATTENDANCE.map((a) =>
    a.status === "safe" ? "#22c55e" : a.status === "warning" ? "#f59e0b" : "#ef4444"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Your academic insights</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="marks">Marks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Attendance Health */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Attendance Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Badge
                  className={
                    standing.attendanceHealth.status === "good"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : standing.attendanceHealth.status === "warning"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }
                  variant="secondary"
                >
                  {standing.attendanceHealth.status.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{standing.attendanceHealth.safeCount}</p>
                  <p className="text-xs text-muted-foreground">Safe</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{standing.attendanceHealth.warningCount}</p>
                  <p className="text-xs text-muted-foreground">Warning</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{standing.attendanceHealth.criticalCount}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Semester Progress */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Semester Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Week {standing.semesterProgress.currentWeek} of {standing.semesterProgress.totalWeeks}</span>
                <span className="text-sm font-semibold">{standing.semesterProgress.percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${standing.semesterProgress.percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assessment Performance */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Assessment Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className="text-sm font-semibold">{standing.assessmentPerformance.averageScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Highest Subject</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {standing.assessmentPerformance.highestSubject}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lowest Subject</span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {standing.assessmentPerformance.lowestSubject}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Subject-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {attChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={attColors[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marks">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="week" fontSize={12} />
                    <YAxis fontSize={12} domain={[60, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#171717" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
