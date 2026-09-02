"use client";

import { useState } from "react";
import { DEMO_NOTIFICATIONS } from "@/utils/demo-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  attendance: "bg-destructive/10 text-destructive",
  marks: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  timetable: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  exam: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  assignment: "bg-green-500/10 text-green-600 dark:text-green-400",
  event: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  system: "bg-muted text-muted-foreground",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">{unread} unread notifications</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={cn(
              "border-border cursor-pointer hover:border-foreground/20 transition-colors",
              !n.read && "bg-accent/50"
            )}
            onClick={() => markRead(n.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 h-2 w-2 rounded-full flex-shrink-0", !n.read ? "bg-primary" : "bg-transparent")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <Badge className={cn("text-[10px] flex-shrink-0", categoryColors[n.category])} variant="secondary">
                      {n.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {n.actionUrl && (
                    <Link href={n.actionUrl} className="text-xs text-primary hover:underline mt-2 inline-block">
                      View details
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
