"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Events</h1>
        <p className="text-xs text-muted-foreground mt-1">Campus events and activities</p>
      </div>

      <Card className="border-border">
        <CardContent className="py-12 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No events available</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Campus events will appear here when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
