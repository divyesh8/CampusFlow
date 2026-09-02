"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Unplug, Shield, Info } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

function formatSyncTime(lastSyncAt: string | null) {
  if (!lastSyncAt) return "Never";
  const diff = Date.now() - new Date(lastSyncAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function SettingsPage() {
  const { user, signOut, lastSyncAt } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [, setTick] = useState(0);

  const syncLabel = formatSyncTime(lastSyncAt);

  const tick = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [tick]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await fetch("/api/srm/sync", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">App configuration and connection</p>
      </div>

      {/* SRM Connection */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">SRM Connection</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge variant={user?.onboarded ? "default" : "secondary"} className="text-[10px]">
                {user?.onboarded ? "Connected" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">NetID</span>
              <span className="text-xs font-medium">{user?.studentId || "Not connected"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Last Sync</span>
              <span className="text-xs font-medium">{syncLabel}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDisconnect}
            >
              <Unplug className="h-3.5 w-3.5 mr-1.5" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">About</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Version</span>
              <span className="text-xs font-medium">0.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">SRM Integration</span>
              <Badge variant="secondary" className="text-[10px]">In Development</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
        CampusFlow is an independent student-built tool and is not an official SRMIST service.
        Your SRM password is used only during authentication and is never stored.
      </p>
    </div>
  );
}
