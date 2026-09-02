"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEMO_ATTENDANCE, DEMO_EXAMS, DEMO_ASSIGNMENTS, DEMO_CAMPUS_EVENTS, DEMO_CLUBS } from "@/utils/demo-data";

const searchItems = [
  { label: "Dashboard", href: "/dashboard", category: "page" },
  { label: "Attendance", href: "/attendance", category: "page" },
  { label: "Marks", href: "/marks", category: "page" },
  { label: "Timetable", href: "/timetable", category: "page" },
  { label: "Calendar", href: "/calendar", category: "page" },
  { label: "Exams", href: "/exams", category: "page" },
  { label: "Assignments", href: "/assignments", category: "page" },
  { label: "Events", href: "/events", category: "page" },
  { label: "Clubs", href: "/clubs", category: "page" },
  { label: "Mess", href: "/mess", category: "page" },
  { label: "Analytics", href: "/analytics", category: "page" },
  { label: "Profile", href: "/profile", category: "page" },
  { label: "Settings", href: "/settings", category: "page" },
  ...DEMO_ATTENDANCE.map((a) => ({ label: a.subjectName, href: "/attendance", category: "subject" })),
  ...DEMO_EXAMS.map((e) => ({ label: `${e.subjectName} — ${e.name}`, href: "/exams", category: "exam" })),
  ...DEMO_ASSIGNMENTS.map((a) => ({ label: a.title, href: "/assignments", category: "assignment" })),
  ...DEMO_CAMPUS_EVENTS.map((e) => ({ label: e.title, href: "/events", category: "event" })),
  ...DEMO_CLUBS.map((c) => ({ label: c.name, href: "/clubs", category: "club" })),
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filtered = query
    ? searchItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : searchItems.slice(0, 10);

  const grouped = filtered.reduce(
    (acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, typeof searchItems>
  );

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden md:flex items-center gap-2 text-muted-foreground h-8 px-3"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search</span>
        <kbd className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
          <Command className="h-2.5 w-2.5 inline" /> K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-lg">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Search subjects, exams, events..."
              className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-2">
                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground capitalize">
                  {category}
                </p>
                {items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleSelect(item.href)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground text-center">No results found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
