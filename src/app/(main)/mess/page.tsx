"use client";

import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

export default function MessPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Mess</h1>
        <p className="text-xs text-muted-foreground mt-1">Today&apos;s mess menu</p>
      </div>

      <Card className="border-border">
        <CardContent className="py-12 text-center">
          <UtensilsCrossed className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Mess data not available</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Mess menu data will appear here when available from SRM.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
