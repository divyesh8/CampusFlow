"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommandSearch() {
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9">
      <Search className="h-4 w-4" />
    </Button>
  );
}
