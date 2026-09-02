"use client";

import { useState } from "react";
import { DEMO_MARKS } from "@/utils/demo-data";
import { getSubjectMarks, calculateAttendancePercentage } from "@/utils/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Target,
  BarChart3,
  Calculator,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function MarksPage() {
  const subjects = getSubjectMarks(DEMO_MARKS);
  const totalObtained = subjects.reduce((s, m) => s + m.totalObtained, 0);
  const totalMax = subjects.reduce((s, m) => s + m.totalMax, 0);
  const overallPercentage = calculateAttendancePercentage(totalObtained, totalMax);
  const sorted = [...subjects].sort((a, b) => b.percentage - a.percentage);
  const [targetScore, setTargetScore] = useState("85");

  const chartData = subjects.map((s) => ({
    name: s.subjectCode,
    percentage: s.percentage,
  }));

  const barColors = subjects.map((s) =>
    s.percentage >= 80 ? "#22c55e" : s.percentage >= 60 ? "#f59e0b" : "#ef4444"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marks</h1>
        <p className="text-muted-foreground mt-1">Track your academic performance</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Score</p>
            <p className="text-2xl font-bold mt-1">{totalObtained}/{totalMax}</p>
            <p className="text-xs text-muted-foreground">{overallPercentage}%</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Highest</p>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              {sorted[0]?.percentage || 0}%
            </p>
            <p className="text-xs text-muted-foreground">{sorted[0]?.subjectCode}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Lowest</p>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
              {sorted[sorted.length - 1]?.percentage || 0}%
            </p>
            <p className="text-xs text-muted-foreground">{sorted[sorted.length - 1]?.subjectCode}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Subjects</p>
            <p className="text-2xl font-bold mt-1">{subjects.length}</p>
            <p className="text-xs text-muted-foreground">assessed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="target">Target Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-3">
          {subjects.map((subject) => (
            <Card key={subject.subjectId} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">{subject.subjectName}</p>
                    <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                  </div>
                  <Badge
                    variant={subject.percentage >= 80 ? "default" : subject.percentage >= 60 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {subject.percentage}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">
                    {subject.totalObtained}/{subject.totalMax}
                  </span>
                </div>
                <div className="space-y-2">
                  {subject.assessments.map((a) => (
                    <div key={a.assessmentId} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{a.name}</span>
                      <span className="font-medium">
                        {a.marksObtained}/{a.maxMarks}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="chart">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Subject Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={barColors[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="target">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Target Score Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Desired Final Score (%)</Label>
                <Input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-3">
                {subjects.map((subject) => {
                  const target = parseFloat(targetScore) || 85;
                  const targetTotal = Math.round((subject.totalMax * target) / 100);
                  const remaining = targetTotal - subject.totalObtained;
                  return (
                    <div key={subject.subjectId} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{subject.subjectName}</p>
                          <p className="text-xs text-muted-foreground">
                            Current: {subject.totalObtained}/{subject.totalMax} ({subject.percentage}%)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {remaining > 0 ? `${remaining} more` : "Target met"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {remaining > 0 ? `Need ${targetTotal} total` : "✓"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimates are approximate. Actual requirements depend on remaining assessment weightage.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
