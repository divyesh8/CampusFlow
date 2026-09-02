"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CampusFlowLogo } from "@/components/brand/campusflow-logo";
import { Clock, BookOpen, BarChart3, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px]">
        <header className="border-b border-border">
          <div className="px-4 h-14 flex items-center justify-between">
            <CampusFlowLogo size={24} showWordmark />
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          </div>
        </header>

        <section className="px-4 py-16 text-center">
          <div className="flex justify-center mb-6">
            <CampusFlowLogo size={56} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight max-w-sm mx-auto">
            Know where you stand. Every day.
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto leading-relaxed">
            Attendance, marks, timetable and academic updates from your SRM portal — clear, fast and built for mobile.
          </p>
          <div className="flex flex-col items-center gap-3 mt-8">
            <Link href="/login" className="w-full max-w-xs">
              <Button size="lg" className="w-full">
                Connect SRM
              </Button>
            </Link>
            <Link href="/login" className="w-full max-w-xs">
              <Button size="lg" variant="outline" className="w-full">
                Preview
              </Button>
            </Link>
          </div>
        </section>

        <section className="px-4 py-12 space-y-4">
          {[
            {
              icon: BarChart3,
              title: "Real Academics",
              description: "Attendance and marks synchronized from your connected SRM account.",
            },
            {
              icon: Clock,
              title: "Smart Attendance",
              description: "Know how many classes you can miss or need to attend.",
            },
            {
              icon: BookOpen,
              title: "Today",
              description: "See your next class, academic risks and important updates immediately.",
            },
          ].map((feature) => (
            <Card key={feature.title} className="border-border">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="px-4 py-8 text-center border-t border-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Privacy</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Your SRM password is used only during authentication and is never stored by CampusFlow.
            Disconnect anytime.
          </p>
          <p className="text-[11px] text-muted-foreground mt-4">
            CampusFlow is an independent student-built tool and is not an official SRMIST service.
          </p>
        </section>
      </div>
    </div>
  );
}
