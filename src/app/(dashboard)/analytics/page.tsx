"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { StudentIntelligence } from "@/components/analytics/StudentIntelligence";
import { BusinessIntelligence } from "@/components/analytics/BusinessIntelligence";
import { Loader2, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const { user, profile, isLoading } = useAuthStore();

  const isBusiness = profile?.role === "business";
  const roleLabel = profile?.role === "student" ? "Student Intelligence" : isBusiness ? "Business Operations" : "Intelligence Layer";

  if (isLoading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <p className="text-sm text-brand-muted">Synchronizing intelligence layer...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-[12px] border border-brand-hairline bg-white p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-[10px] bg-brand-surface-soft text-brand-muted mb-4">
          <BarChart2 className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-brand-ink">Authentication Required</h3>
        <p className="text-xs text-brand-muted mt-1 max-w-sm">
          Please sign in to access your operational workspace metrics and marketplace demand intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <span className="rounded-full bg-brand-surface-strong px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          {roleLabel}
        </span>
        <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink mt-2">
          Analytics & Intelligence
        </h1>
        <p className="mt-2 text-sm leading-[1.25] text-brand-muted">
          {isBusiness
            ? "Track workforce execution, spend trends, proposal quality, and gig pipelines."
            : "Review productivity, earnings, trust score progression, and real market demand."}
        </p>
      </motion.div>

      {/* Main Analytics View */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        {isBusiness ? <BusinessIntelligence /> : <StudentIntelligence />}
      </motion.div>
    </div>
  );
}

