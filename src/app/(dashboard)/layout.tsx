"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { HyperAI } from "@/components/ai/hyperai";
import { StrategicAdvisorWidget } from "@/components/ai/hyperai/StrategicAdvisorWidget";
import { contextEngine } from "@/lib/hyperai/context-engine";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, isLoading } = useAuthStore();

  React.useEffect(() => {
    if (!isLoading && (!user || !profile)) {
      router.replace("/login");
    }
  }, [user, profile, isLoading, router]);

  React.useEffect(() => {
    if (user && profile?.role) {
      contextEngine.boot(user.uid, profile.role);
    }
    return () => {
      contextEngine.shutdown();
    };
  }, [user?.uid, profile?.role]);

  // Premium loading state while resolving authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase text-brand-ink font-mono animate-pulse">
          Authenticating Session...
        </span>
      </div>
    );
  }

  // Prevent flash of content during redirect
  if (!user || !profile) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-brand-ink">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto bg-brand-surface-soft p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl w-full">
            {profile?.role !== "business" && <StrategicAdvisorWidget />}
            {children}
          </div>
        </main>
      </div>

      {/* HyperAI — Global AI Assistant, persistent across all dashboard pages */}
      <HyperAI />
    </div>
  );
}
