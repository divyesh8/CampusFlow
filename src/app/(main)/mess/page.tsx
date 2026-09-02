"use client";

import { useState } from "react";
import { DEMO_MESS } from "@/utils/demo-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, Coffee, Sun, Moon } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

const mealIcons: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  snacks: UtensilsCrossed,
  dinner: Moon,
};

const mealColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  lunch: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  snacks: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  dinner: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function MessPage() {
  const [selectedDay, setSelectedDay] = useState(0);

  const messData = [
    { date: new Date(), meals: DEMO_MESS.meals },
    {
      date: addDays(new Date(), 1),
      meals: [
        { type: "breakfast" as const, items: ["Dosa", "Sambar", "Coconut Chutney", "Tea/Coffee"] },
        { type: "lunch" as const, items: ["Rice", "Rasam", "Chicken Curry", "Raita", "Papad"] },
        { type: "snacks" as const, items: ["Bread Pakoda", "Tea", "Biscuits"] },
        { type: "dinner" as const, items: ["Rice", "Dal", "Paneer Tikka", "Roti", "Kheer"] },
      ],
    },
    {
      date: addDays(new Date(), 2),
      meals: [
        { type: "breakfast" as const, items: ["Poha", "Boiled Eggs", "Tea/Coffee"] },
        { type: "lunch" as const, items: ["Rice", "Sambar", "Aloo Gobi", "Curd", "Salad"] },
        { type: "snacks" as const, items: ["Vada Pav", "Tea"] },
        { type: "dinner" as const, items: ["Chapati", "Butter Chicken", "Rice", "Dal Fry", "Gulab Jamun"] },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mess Menu</h1>
        <p className="text-muted-foreground mt-1">Today&apos;s meal schedule</p>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2].map((day) => (
          <Button
            key={day}
            variant={selectedDay === day ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setSelectedDay(day)}
          >
            {day === 0 ? "Today" : day === 1 ? "Tomorrow" : format(addDays(new Date(), day), "EEE")}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {messData[selectedDay].meals.map((meal) => {
          const Icon = mealIcons[meal.type];
          return (
            <Card key={meal.type} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", mealColors[meal.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold capitalize">{meal.type}</p>
                    <p className="text-xs text-muted-foreground">{meal.items.length} items</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meal.items.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border bg-muted/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Menu data may be community-verified. Report inaccuracies in settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
