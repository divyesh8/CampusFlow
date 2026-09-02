"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // If user is already onboarded, go to dashboard
      if (user.onboarded) {
        router.push("/dashboard");
      } else {
        // For now, redirect to settings to complete SRM setup
        router.push("/settings");
      }
    } else if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Setting up CampusFlow\u2026</p>
      </div>
    </div>
  );
}
