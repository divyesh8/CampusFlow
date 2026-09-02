"use client";

import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { CommandSearch } from "@/components/search/command-search";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <BottomNav />

      <main className="lg:ml-64 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="lg:hidden flex items-center gap-2">
              <span className="text-lg font-bold">CampusFlow</span>
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <CommandSearch />
              <Button variant="ghost" size="icon" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              </Button>
              <NotificationBell />
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
