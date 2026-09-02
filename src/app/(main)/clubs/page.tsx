"use client";

import { DEMO_CLUBS } from "@/utils/demo-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Globe, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  technical: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cultural: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  sports: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  entrepreneurship: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  music: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  dance: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  gaming: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  photography: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  social_service: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function ClubsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clubs</h1>
        <p className="text-muted-foreground mt-1">Explore campus clubs and communities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DEMO_CLUBS.map((club) => (
          <Card key={club.id} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{club.name}</p>
                    <Badge className={cn("text-[10px] capitalize mt-1", categoryColors[club.category])} variant="secondary">
                      {club.category.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{club.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs">
                  View Profile
                </Button>
                {club.socialLinks?.website && (
                  <Button size="sm" variant="ghost" className="text-xs px-2">
                    <Globe className="h-3.5 w-3.5" />
                  </Button>
                )}
                {(club.socialLinks?.instagram || club.socialLinks?.twitter) && (
                  <Button size="sm" variant="ghost" className="text-xs px-2">
                    <Link2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
