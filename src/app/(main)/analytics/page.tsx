"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-xs text-muted-foreground mt-1">Academic insights and trends</p>
      </div>

      <Card className="border-border">
        <CardContent className="py-12 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No analytics yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Academic analytics will be available after you sync real data from SRM.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
