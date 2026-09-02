"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  BookOpen,
  Calendar,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatSyncTime(lastSyncAt: string | null): string | null {
  if (!lastSyncAt) return null;
  const diff = Date.now() - new Date(lastSyncAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const { user, lastSyncAt } = useAuth();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle");
  const [, setTick] = useState(0);

  const syncLabel = formatSyncTime(lastSyncAt);

  const tick = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [tick]);

  const handleSync = async () => {
    if (syncStatus === "syncing") return;
    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/srm/sync", { method: "POST" });
      if (res.ok) {
        setSyncStatus("idle");
        window.location.reload();
      } else {
        setSyncStatus("error");
        setTimeout(() => setSyncStatus("idle"), 5000);
      }
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 5000);
    }
  };

  const displayName = user?.name
    ? user.name.split(" ")[0]
    : user?.studentId || "Student";

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold">
          {getGreeting()}, {displayName}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{formatDate(new Date())}</p>
          {syncStatus === "syncing" && (
            <Badge variant="outline" className="text-[10px]">Syncing\u2026</Badge>
          )}
          {syncStatus === "error" && (
            <Badge variant="destructive" className="text-[10px]">Sync failed</Badge>
          )}
          {syncStatus === "idle" && syncLabel && (
            <span className="text-[10px] text-muted-foreground">
              Updated {syncLabel}
            </span>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {user?.onboarded ? (
        <Card className="border-green-200 dark:border-green-900 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Connected to SRM
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.name || user.studentId} \u2022 {user.email}
                </p>
              </div>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Profile <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Complete SRM Setup</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect your SRM account to sync real attendance, marks and timetable data.
                </p>
                <Link href="/settings">
                  <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs px-0">
                    Go to Settings <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/attendance">
          <Card className="border-border hover:border-foreground/20 transition-colors cursor-pointer h-full">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Attendance</span>
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">--</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {user?.onboarded ? "Tap to view" : "Connect SRM to view"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/marks">
          <Card className="border-border hover:border-foreground/20 transition-colors cursor-pointer h-full">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Marks</span>
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">--</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {user?.onboarded ? "Tap to view" : "Connect SRM to view"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-border h-full">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground font-medium uppercase">Classes Today</span>
              <BookOpen className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold">--</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {user?.onboarded ? "From timetable" : "Connect SRM to view"}
            </p>
          </CardContent>
        </Card>

        <Link href="/exams">
          <Card className="border-border hover:border-foreground/20 transition-colors cursor-pointer h-full">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Next Exam</span>
                <Calendar className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold">--</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {user?.onboarded ? "From calendar" : "Connect SRM to view"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Sync */}
      {user?.onboarded && (
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Keep your data fresh</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sync to get the latest attendance, marks and timetable.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleSync}
              disabled={syncStatus === "syncing"}
            >
              {syncStatus === "syncing" ? "Syncing\u2026" : "Sync Now"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
