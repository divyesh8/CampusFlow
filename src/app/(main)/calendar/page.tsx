"use client";

import { useState } from "react";
import { DEMO_EVENTS, DEMO_EXAMS, DEMO_ASSIGNMENTS, DEMO_CAMPUS_EVENTS } from "@/utils/demo-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const eventColors: Record<string, string> = {
  holiday: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  exam: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  assignment: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  event: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  class: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  registration: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  other: "bg-gray-100 text-gray-800",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const allEvents = [
    ...DEMO_EVENTS.map((e) => ({ ...e, color: eventColors[e.type] || eventColors.other })),
    ...DEMO_EXAMS.map((e) => ({
      id: e.id,
      title: `${e.subjectName} - ${e.name}`,
      date: e.date,
      type: "exam" as const,
      isAllDay: true,
      color: eventColors.exam,
    })),
    ...DEMO_ASSIGNMENTS.filter((a) => a.status !== "submitted").map((a) => ({
      id: a.id,
      title: a.title,
      date: a.dueDate,
      type: "assignment" as const,
      isAllDay: true,
      color: eventColors.assignment,
    })),
  ];

  const getEventsForDay = (day: Date) => {
    return allEvents.filter((e) => isSameDay(new Date(e.date), day));
  };

  const upcomingEvents = [...allEvents]
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-1">Academic events, exams, and holidays</p>
      </div>

      <Tabs defaultValue="month" className="space-y-4">
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="month">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-px text-center text-xs text-muted-foreground mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-20 bg-muted/30" />
                ))}
                {days.map((day) => {
                  const events = getEventsForDay(day);
                  const today = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "h-20 p-1 border border-border/50 rounded-md overflow-hidden",
                        today && "bg-accent"
                      )}
                    >
                      <p className={cn("text-xs font-medium mb-1", today && "text-primary font-bold")}>
                        {format(day, "d")}
                      </p>
                      <div className="space-y-0.5">
                        {events.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className={cn("text-[9px] px-1 py-0.5 rounded truncate", e.color)}
                          >
                            {e.title}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <p className="text-[9px] text-muted-foreground">+{events.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-3">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-center min-w-[40px]">
                    <p className="text-xs text-muted-foreground">{format(new Date(event.date), "MMM")}</p>
                    <p className="text-lg font-bold">{format(new Date(event.date), "d")}</p>
                  </div>
                  <div className="flex-1">
                    <Badge className={cn("text-[10px] mb-1", event.color)} variant="secondary">
                      {event.type}
                    </Badge>
                    <p className="text-sm font-semibold">{event.title}</p>
                    {"location" in event && event.location && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.location}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
