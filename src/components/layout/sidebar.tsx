"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  BarChart3,
  Calendar,
  Settings,
  User,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Clock,
  Trophy,
  UtensilsCrossed,
  Megaphone,
  Users,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  {
    label: "Academics",
    items: [
      { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
      { label: "Marks", href: "/marks", icon: BarChart3 },
      { label: "Timetable", href: "/timetable", icon: Clock },
      { label: "Exams", href: "/exams", icon: FileText },
      { label: "Assignments", href: "/assignments", icon: BookOpen },
    ],
  },
  {
    label: "Campus",
    items: [
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Events", href: "/events", icon: Megaphone },
      { label: "Clubs", href: "/clubs", icon: Users },
      { label: "Mess", href: "/mess", icon: UtensilsCrossed },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: Trophy },
    ],
  },
];

const bottomItems = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen border-r border-sidebar-border bg-sidebar fixed left-0 top-0 z-30">
      <div className="flex items-center gap-2 px-6 py-5">
        <GraduationCap className="h-7 w-7 text-foreground" />
        <span className="text-xl font-bold tracking-tight">CampusFlow</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navItems.map((section) => (
          <div key={section.label} className="mb-2">
            {"href" in section ? (
              <Link
                href={section.href || "#"}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === section.href
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                {"icon" in section && section.icon && <section.icon className="h-4 w-4" />}
                {section.label}
              </Link>
            ) : (
              <>
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </p>
                {section.items?.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        ))}
      </nav>

      <Separator />

      <div className="px-3 py-3">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-sidebar-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
