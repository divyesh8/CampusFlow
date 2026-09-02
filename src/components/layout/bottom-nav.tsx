"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ClipboardCheck, Clock, BarChart3, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Calendar,
  FileText,
  BookOpen,
  Users,
  UtensilsCrossed,
  Trophy,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const mainNav = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { label: "Timetable", href: "/timetable", icon: Clock },
  { label: "Marks", href: "/marks", icon: BarChart3 },
];

const moreItems = [
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Exams", href: "/exams", icon: FileText },
  { label: "Assignments", href: "/assignments", icon: BookOpen },
  { label: "Clubs", href: "/clubs", icon: Users },
  { label: "Mess", href: "/mess", icon: UtensilsCrossed },
  { label: "Analytics", href: "/analytics", icon: Trophy },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const isMoreActive = moreItems.some((item) => pathname === item.href);

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-card border-t border-border">
        <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors min-w-[56px]",
                pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", pathname === item.href && "text-foreground")} />
              {item.label}
            </Link>
          ))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors min-w-[56px]",
                isMoreActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              More
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl max-w-[430px] mx-auto">
              <SheetTitle className="text-lg font-semibold mb-4">More</SheetTitle>
              <div className="grid grid-cols-4 gap-3">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[10px] font-medium transition-colors",
                      pathname === item.href
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground"
                  onClick={() => { signOut(); setOpen(false); }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
