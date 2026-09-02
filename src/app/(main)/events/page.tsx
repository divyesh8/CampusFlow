"use client";

import { DEMO_CAMPUS_EVENTS } from "@/utils/demo-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/config/constants";
import { useState } from "react";

const categoryColors: Record<string, string> = {
  technical: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cultural: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  sports: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  workshop: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  hackathon: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  career: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  club: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  fest: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

export default function EventsPage() {
  const [filter, setFilter] = useState<string>("all");
  const events = filter === "all" ? DEMO_CAMPUS_EVENTS : DEMO_CAMPUS_EVENTS.filter((e) => e.category === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-muted-foreground mt-1">Discover campus events and activities</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        {EVENT_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            size="sm"
            className="text-xs capitalize"
            onClick={() => setFilter(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} className="border-border overflow-hidden">
            {event.imageUrl && (
              <div className="h-40 bg-muted" />
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge className={cn("text-[10px] capitalize", categoryColors[event.category])} variant="secondary">
                  {event.category}
                </Badge>
                {event.isRegistered && (
                  <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" variant="secondary">
                    Registered
                  </Badge>
                )}
              </div>
              <h3 className="text-sm font-semibold">{event.title}</h3>
              {event.clubName && (
                <p className="text-xs text-muted-foreground mt-0.5">{event.clubName}</p>
              )}
              {event.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(event.date), "MMM d, yyyy")}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </span>
                )}
                {event.registrationLimit && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.registeredCount}/{event.registrationLimit}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                {!event.isRegistered ? (
                  <Button size="sm" className="text-xs">
                    Register
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs">
                    View Ticket
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-xs">
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No events found in this category.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
