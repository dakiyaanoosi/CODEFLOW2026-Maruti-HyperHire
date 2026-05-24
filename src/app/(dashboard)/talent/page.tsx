"use client";

import * as React from "react";
import { TalentDiscoveryDashboard } from "@/components/talent/TalentDiscoveryDashboard";
import { useAuthStore } from "@/store/use-auth-store";
import { useRouter } from "next/navigation";

export default function TalentDiscoveryPage() {
  const { user, profile } = useAuthStore();
  const router = useRouter();

  // If a student tries to navigate here, we can either block them or let them view their competition.
  // For now, we will allow it, but in a real app we might redirect if not a business.

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-brand-ink tracking-tight">Semantic Talent Discovery</h1>
        <p className="text-sm text-brand-body">
          Explore the workforce graph using natural language. HyperAI will identify the most strategically aligned talent.
        </p>
      </div>

      <TalentDiscoveryDashboard />
    </div>
  );
}
