"use client";

import { BottomNav } from "./bottom-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { CampusFlowLogo } from "@/components/brand/campusflow-logo";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/srm/sync", { method: "POST" });
      if (res.ok) {
        setSyncStatus("success");
        setTimeout(() => setSyncStatus("idle"), 3000);
      } else {
        setSyncStatus("error");
        setTimeout(() => setSyncStatus("idle"), 5000);
      }
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 5000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen pb-20 relative">
        <BottomNav />

        <main>
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <CampusFlowLogo size={28} showWordmark />
              <div className="flex items-center gap-1">
                {syncStatus !== "idle" && (
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                    syncStatus === "syncing" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    syncStatus === "success" && "bg-green-500/10 text-green-600 dark:text-green-400",
                    syncStatus === "error" && "bg-red-500/10 text-red-600 dark:text-red-400",
                  )}>
                    {syncStatus === "syncing" && "Syncing\u2026"}
                    {syncStatus === "success" && "Updated"}
                    {syncStatus === "error" && "Sync failed"}
                  </span>
                )}
                <Button variant="ghost" size="icon" onClick={handleSync} disabled={syncing} className="h-9 w-9">
                  <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                </Button>
                <NotificationBell />
              </div>
            </div>
          </header>
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
