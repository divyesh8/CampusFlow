"use client";

import { useState } from "react";
import { DEMO_ASSIGNMENTS } from "@/utils/demo-data";
import { sortByDeadline, daysUntil } from "@/utils/calculations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, ExternalLink, CheckCircle2, Circle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig = {
  not_started: { icon: Circle, label: "Not Started", color: "text-muted-foreground" },
  in_progress: { icon: Clock, label: "In Progress", color: "text-amber-600 dark:text-amber-400" },
  submitted: { CheckCircle2, label: "Submitted", color: "text-green-600 dark:text-green-400" },
};

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState(sortByDeadline(DEMO_ASSIGNMENTS));
  const [filter, setFilter] = useState<"all" | "pending" | "submitted">("all");

  const filtered = filter === "all"
    ? assignments
    : filter === "pending"
    ? assignments.filter((a) => a.status !== "submitted")
    : assignments.filter((a) => a.status === "submitted");

  const toggleStatus = (id: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "submitted" ? "not_started" : "submitted" }
          : a
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-muted-foreground mt-1">Track your assignment deadlines</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{assignments.filter((a) => a.status !== "submitted").length}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{assignments.filter((a) => a.status === "submitted").length}</p>
            <p className="text-[10px] text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{assignments.filter((a) => daysUntil(a.dueDate) <= 3 && a.status !== "submitted").length}</p>
            <p className="text-[10px] text-muted-foreground">Due Soon</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered.map((assignment) => {
          const days = daysUntil(assignment.dueDate);
          const isOverdue = days < 0 && assignment.status !== "submitted";
          const isDueToday = days === 0 && assignment.status !== "submitted";

          return (
            <Card key={assignment.id} className={`border-border ${isOverdue ? "border-red-200 dark:border-red-900" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleStatus(assignment.id)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {assignment.status === "submitted" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${assignment.status === "submitted" ? "line-through opacity-60" : ""}`}>
                          {assignment.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{assignment.subjectName}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`text-[10px] ${priorityColors[assignment.priority]}`} variant="secondary">
                          {assignment.priority}
                        </Badge>
                      </div>
                    </div>
                    {assignment.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      {assignment.status !== "submitted" && (
                        <Badge
                          variant={isOverdue ? "destructive" : isDueToday ? "destructive" : days <= 3 ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {filter === "submitted" ? "No submitted assignments yet." : "No pending assignments. Great job!"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
