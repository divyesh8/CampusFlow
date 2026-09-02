"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Notifications</h1>
        <p className="text-xs text-muted-foreground mt-1">Alerts and updates</p>
      </div>

      <Card className="border-border">
        <CardContent className="py-12 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No notifications</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Notifications about attendance, marks and exams will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
