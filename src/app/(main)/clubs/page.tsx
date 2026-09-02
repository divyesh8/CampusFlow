"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ClubsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Clubs</h1>
        <p className="text-xs text-muted-foreground mt-1">Campus clubs and communities</p>
      </div>

      <Card className="border-border">
        <CardContent className="py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No clubs available</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Campus clubs will appear here when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
