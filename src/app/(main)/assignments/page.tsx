"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Assignments</h1>
        <p className="text-xs text-muted-foreground mt-1">Track your assignment deadlines</p>
      </div>

      <Card className="border-amber-200 dark:border-amber-900 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">SRM Integration Pending</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real assignment data from SRM will appear here once the integration is complete.
              </p>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="mt-2 text-xs px-0">
                  Connect SRM account
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="py-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No assignments yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Your assignments from SRM will appear here after you connect your account and sync.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
