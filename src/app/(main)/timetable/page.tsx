"use client";

import { useState } from "react";
import { DEMO_TIMETABLE } from "@/utils/demo-data";
import { formatTime, getFreePeriods, getTimeUntil, getNextClass } from "@/utils/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  MapPin,
  User,
  Coffee,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK } from "@/config/constants";

export default function TimetablePage() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const nextClass = getNextClass(DEMO_TIMETABLE, []);

  const dayEntries = DEMO_TIMETABLE
    .filter((e) => e.dayOfWeek === selectedDay)
    .sort((a, b) => {
      const [aH, aM] = a.startTime.split(":").map(Number);
      const [bH, bM] = b.startTime.split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });

  const freePeriods = getFreePeriods(DEMO_TIMETABLE, selectedDay);
  const totalHours = dayEntries.filter((e) => e.type !== "break").reduce((sum, e) => {
    const [startH, startM] = e.startTime.split(":").map(Number);
    const [endH, endM] = e.endTime.split(":").map(Number);
    return sum + (endH * 60 + endM - (startH * 60 + startM)) / 60;
  }, 0);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timetable</h1>
          <p className="text-muted-foreground mt-1">Your weekly class schedule</p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS_OF_WEEK.map((day, i) => (
          <Button
            key={i}
            variant={selectedDay === i ? "default" : "outline"}
            size="sm"
            className={cn("min-w-[70px] text-xs", selectedDay === i && "bg-primary text-primary-foreground")}
            onClick={() => setSelectedDay(i)}
          >
            {day.slice(0, 3)}
          </Button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{dayEntries.filter((e) => e.type !== "break").length}</p>
            <p className="text-[10px] text-muted-foreground">Classes</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{totalHours.toFixed(1)}h</p>
            <p className="text-[10px] text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{freePeriods.length}</p>
            <p className="text-[10px] text-muted-foreground">Free Periods</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Class */}
      {nextClass && selectedDay === now.getDay() && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Next Class</p>
                <p className="text-sm font-semibold">{nextClass.subjectName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(nextClass.startTime)} — {nextClass.room}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {getTimeUntil(nextClass.startTime)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable */}
      <div className="space-y-2">
        {dayEntries.map((entry) => {
          const [startH, startM] = entry.startTime.split(":").map(Number);
          const entryMinutes = startH * 60 + startM;
          const [endH, endM] = entry.endTime.split(":").map(Number);
          const endMinutes = endH * 60 + endM;
          const isCurrentClass = selectedDay === now.getDay() &&
            entryMinutes <= currentMinutes && endMinutes > currentMinutes;
          const isPast = selectedDay === now.getDay() && endMinutes <= currentMinutes;
          const isNext = nextClass?.id === entry.id && selectedDay === now.getDay();

          if (entry.type === "break") {
            return (
              <div key={entry.id} className="flex items-center gap-3 py-2 px-4">
                <div className="w-16 text-xs text-muted-foreground text-right font-mono">
                  {formatTime(entry.startTime)}
                </div>
                <div className="flex-1 border-t border-dashed border-border" />
                <Coffee className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Break</p>
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="w-16 text-xs text-muted-foreground font-mono">
                  {formatTime(entry.endTime)}
                </div>
              </div>
            );
          }

          return (
            <Card
              key={entry.id}
              className={cn(
                "border-border transition-all",
                isCurrentClass && "border-primary ring-1 ring-primary/20",
                isPast && "opacity-50",
                isNext && "border-primary/50"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-xs font-mono text-muted-foreground">{formatTime(entry.startTime)}</p>
                    <div className="h-px bg-border my-1" />
                    <p className="text-xs font-mono text-muted-foreground">{formatTime(entry.endTime)}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{entry.subjectName}</p>
                        <p className="text-xs text-muted-foreground">{entry.subjectCode}</p>
                      </div>
                      {isCurrentClass && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">NOW</Badge>
                      )}
                      {isNext && (
                        <Badge variant="outline" className="text-[10px]">NEXT</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {entry.room}{entry.building ? `, ${entry.building}` : ""}
                      </span>
                      {entry.faculty && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.faculty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Free Periods */}
      {freePeriods.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Free Periods</h3>
          <div className="space-y-2">
            {freePeriods.map((fp, i) => (
              <Card key={i} className="border-border bg-green-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium">
                        {formatTime(fp.start)} — {formatTime(fp.end)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">{fp.duration}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
