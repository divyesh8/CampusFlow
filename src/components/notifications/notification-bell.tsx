"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function NotificationBell() {
  return (
    <Link href="/notifications">
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Bell className="h-4 w-4" />
      </Button>
    </Link>
  );
}
