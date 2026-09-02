"use client";

import { useState } from "react";
import { DEMO_ATTENDANCE } from "@/utils/demo-data";
import { calculateAttendancePercentage, calculateCanBunk, calculateMustAttend, calculateSimulatedAttendance } from "@/utils/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Calculator,
  BarChart3,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const statusConfig = {
  safe: { color: "text-green-700 dark:text-green-400", bg: "bg-green-500/10", icon: CheckCircle2, label: "SAFE" },
  warning: { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10", icon: AlertTriangle, label: "WARNING" },
  critical: { color: "text-red-700 dark:text-red-400", bg: "bg-red-500/10", icon: AlertTriangle, label: "AT RISK" },
};

const mockTrendData = [
  { day: "Mon", os: 85, cn: 70, java: 88, ds: 82, ps: 72 },
  { day: "Tue", os: 86, cn: 70, java: 89, ds: 83, ps: 73 },
  { day: "Wed", os: 86, cn: 70, java: 90, ds: 83, ps: 73 },
  { day: "Thu", os: 86, cn: 70, java: 90, ds: 83, ps: 73 },
  { day: "Fri", os: 86, cn: 70, java: 90, ds: 83, ps: 73 },
];

export default function AttendancePage() {
  const { user } = useAuth();
  const threshold = user?.attendanceThreshold || 75;
  const [simSubject, setSimSubject] = useState(DEMO_ATTENDANCE[0]?.subjectId || "");
  const [simActions, setSimActions] = useState<("attend" | "miss")[]>([]);

  const totalAttended = DEMO_ATTENDANCE.reduce((s, a) => s + a.attended, 0);
  const totalConducted = DEMO_ATTENDANCE.reduce((s, a) => s + a.conducted, 0);
  const overallPercentage = calculateAttendancePercentage(totalAttended, totalConducted);

  const simSubjectData = DEMO_ATTENDANCE.find((a) => a.subjectId === simSubject);
  const simResult = simSubjectData
    ? calculateSimulatedAttendance(simSubjectData.attended, simSubjectData.conducted, simActions)
    : 0;

  const addSimAction = (action: "attend" | "miss") => {
    setSimActions((prev) => [...prev, action]);
  };

  const resetSim = () => setSimActions([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground mt-1">Track and manage your attendance across all subjects</p>
      </div>

      {/* Overall Stats */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall Attendance</p>
              <p className="text-4xl font-bold mt-1">{overallPercentage}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {totalAttended} attended / {totalConducted} conducted
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant={overallPercentage >= threshold ? "default" : "destructive"}
                className="text-sm"
              >
                {overallPercentage >= threshold ? "On Track" : "Below Threshold"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Required: {threshold}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="calculator">Can I Bunk?</TabsTrigger>
          <TabsTrigger value="simulator">Simulator</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-3">
          {DEMO_ATTENDANCE.map((subject) => {
            const config = statusConfig[subject.status];
            const StatusIcon = config.icon;
            return (
              <Card key={subject.subjectId} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold">{subject.subjectName}</p>
                      <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                    </div>
                    <Badge className={`${config.bg} ${config.color} border-0`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{subject.percentage}%</span>
                    <span className="text-sm text-muted-foreground">
                      {subject.attended}/{subject.conducted}
                    </span>
                  </div>
                  <Progress value={subject.percentage} className="h-2" />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {subject.canBunk > 0
                        ? `Can skip ${subject.canBunk} more class${subject.canBunk > 1 ? "es" : ""}`
                        : subject.mustAttend > 0
                        ? `Attend next ${subject.mustAttend} classes`
                        : "At threshold"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Can I Bunk?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEMO_ATTENDANCE.map((subject) => {
                const canBunk = calculateCanBunk(subject.attended, subject.conducted, threshold);
                return (
                  <div key={subject.subjectId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{subject.subjectName}</p>
                      <p className="text-xs text-muted-foreground">{subject.percentage}%</p>
                    </div>
                    <div className="text-right">
                      {canBunk > 0 ? (
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {canBunk} class{canBunk > 1 ? "es" : ""}
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          Cannot skip
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">can skip</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Recovery Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEMO_ATTENDANCE.filter((s) => s.percentage < threshold).map((subject) => {
                const mustAttend = calculateMustAttend(subject.attended, subject.conducted, threshold);
                return (
                  <div key={subject.subjectId} className="p-3 rounded-lg bg-red-500/5 border border-red-200 dark:border-red-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{subject.subjectName}</p>
                        <p className="text-xs text-muted-foreground">{subject.percentage}% → {threshold}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {mustAttend}
                        </p>
                        <p className="text-xs text-muted-foreground">classes needed</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {DEMO_ATTENDANCE.filter((s) => s.percentage < threshold).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All subjects are above the attendance threshold.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Attendance Simulator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Subject</label>
                <Select value={simSubject} onValueChange={(v) => { if (v) { setSimSubject(v); resetSim(); } }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_ATTENDANCE.map((s) => (
                      <SelectItem key={s.subjectId} value={s.subjectId}>
                        {s.subjectName} ({s.percentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {simSubjectData && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current</span>
                      <span className="text-lg font-bold">{simSubjectData.percentage}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium">After simulation</span>
                      <span className={`text-lg font-bold ${simResult >= threshold ? "text-green-600" : "text-red-600"}`}>
                        {simResult}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => addSimAction("attend")} className="flex-1">
                      + Attend
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addSimAction("miss")} className="flex-1">
                      + Miss
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetSim}>
                      Reset
                    </Button>
                  </div>

                  {simActions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {simActions.map((action, i) => (
                        <Badge
                          key={i}
                          variant={action === "attend" ? "default" : "destructive"}
                          className="text-[10px]"
                        >
                          {action === "attend" ? "✓" : "✗"}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Attendance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} domain={[50, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="os" stroke="#22c55e" name="OS" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cn" stroke="#ef4444" name="CN" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="java" stroke="#3b82f6" name="Java" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ds" stroke="#f59e0b" name="DS" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ps" stroke="#8b5cf6" name="PS" strokeWidth={2} dot={false} />
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
