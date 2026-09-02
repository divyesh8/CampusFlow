"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DEMO_NOTIFICATIONS } from "@/utils/demo-data";
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

export function NotificationBell() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full"
          >
            {unread}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-7">
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.actionUrl || "#"}
                className={cn(
                  "flex gap-3 px-4 py-3 hover:bg-accent transition-colors border-b last:border-0",
                  !n.read && "bg-accent/50"
                )}
              >
                <div className={cn("mt-0.5 h-2 w-2 rounded-full flex-shrink-0", !n.read ? "bg-primary" : "bg-transparent")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", categoryColors[n.category])}>
                      {n.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t">
          <Link href="/notifications" className="text-xs text-primary hover:underline">
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
