"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardSkeleton } from "@/components/skeletons";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted && !user) {
      router.push("/login");
    }
  }, [loading, mounted, user, router]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-[430px]">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}
