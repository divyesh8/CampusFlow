"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Clock, BookOpen, Calendar, Bell, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <span className="text-lg font-bold">CampusFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto">
          College shouldn&apos;t need ten different apps.
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
          Attendance, marks, timetable, exams and campus life — one dashboard.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/login">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Clock,
              title: "Smart Timetable",
              description: "Your weekly schedule with next class, free periods, and real-time updates.",
            },
            {
              icon: BookOpen,
              title: "Attendance Tracker",
              description: "Can I Bunk calculator, recovery tracker, and simulated predictions.",
            },
            {
              icon: Calendar,
              title: "Academic Calendar",
              description: "Exams, assignments, and campus events in one place.",
            },
            {
              icon: Bell,
              title: "Notifications",
              description: "Attendance alerts, marks updates, and deadline reminders.",
            },
            {
              icon: Shield,
              title: "Privacy First",
              description: "Your academic data belongs to you. We never share it.",
            },
            {
              icon: GraduationCap,
              title: "University Integration",
              description: "Connect to your university for automatic data sync.",
            },
          ].map((feature) => (
            <Card key={feature.title} className="border-border">
              <CardContent className="p-6">
                <feature.icon className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Ready to simplify college?</h2>
        <p className="text-muted-foreground mt-2">Join CampusFlow and focus on what matters.</p>
        <Link href="/login" className="mt-6 inline-block">
          <Button size="lg" className="gap-2">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <p>&copy; 2026 CampusFlow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login">Privacy</Link>
            <Link href="/login">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
