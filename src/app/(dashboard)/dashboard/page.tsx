"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { Briefcase, Store } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { StudentAIRecommendations } from "@/components/ai/StudentAIRecommendations";
import { BusinessAIRecommendations } from "@/components/ai/BusinessAIRecommendations";
import { AIHeatmapWidget } from "@/components/analytics/AIHeatmapWidget";
import { BusinessIntelligence } from "@/components/analytics/BusinessIntelligence";
import { StudentIntelligence } from "@/components/analytics/StudentIntelligence";
import { jobService } from "@/lib/job-service";
import { Job } from "@/types/job";

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const [businessJobs, setBusinessJobs] = React.useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = React.useState(false);

  const firstName = profile?.name?.split(" ")[0] || "there";
  const isBusiness = profile?.role === "business";
  const roleLabel = profile?.role === "student" ? "Student Talent" : isBusiness ? "Business" : "User";
  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  React.useEffect(() => {
    async function loadBusinessJobs() {
      if (user?.uid && isBusiness) {
        setLoadingJobs(true);
        try {
          const jobs = await jobService.getJobs(user.uid);
          setBusinessJobs(jobs.filter((j) => j.status === "Published"));
        } catch (e) {
          console.error("Failed to load business jobs on dashboard", e);
        } finally {
          setLoadingJobs(false);
        }
      }
    }
    loadBusinessJobs();
  }, [user, isBusiness]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="rounded-full bg-brand-surface-strong px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
              {roleLabel}
            </span>
          </div>
          <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-2 text-sm font-normal leading-[1.5] text-brand-body">
            Your hyperlocal intelligence dashboard is ready.
          </p>
        </div>

        <Link
          href={isBusiness ? "/jobs" : "/marketplace"}
          className="flex shrink-0 items-center gap-2 rounded-[12px] bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-active active:bg-brand-primary-active sm:self-end"
        >
          {isBusiness ? <Briefcase className="h-4 w-4" /> : <Store className="h-4 w-4" />}
          {isBusiness ? "Manage Gigs" : "Browse Marketplace"}
        </Link>
      </motion.div>

      {/* Intelligence & Analytics Layer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      >
        {isBusiness ? <BusinessIntelligence /> : <StudentIntelligence />}
      </motion.div>

      {/* Main Grids */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          className="lg:col-span-2 space-y-6"
        >
          {/* AI Match Recommendations */}
          {isBusiness ? (
            businessJobs.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-brand-ink" />
                  <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wider">
                    Semantic Matches for: {businessJobs[0].title}
                  </h3>
                </div>
                <BusinessAIRecommendations job={businessJobs[0]} />
              </div>
            ) : (
              <div className="rounded-[10px] border border-brand-hairline bg-white p-6 text-center text-brand-muted space-y-3">
                <Briefcase className="h-8 w-8 mx-auto text-brand-hairline animate-bounce" />
                <h3 className="text-xs font-semibold text-brand-ink">Enable AI Talent Recommendations</h3>
                <p className="text-[11px] leading-relaxed max-w-sm mx-auto">
                  Publish an active digital gig to let HyperHire's semantic matching engine scan and recommend compatible student talent.
                </p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-brand-ink px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Post First Gig
                </Link>
              </div>
            )
          ) : (
            <StudentAIRecommendations />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Market Intelligence Heatmap */}
          <AIHeatmapWidget />
        </motion.div>
      </div>
    </div>
  );
}
