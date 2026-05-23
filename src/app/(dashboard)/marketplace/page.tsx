"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { jobService } from "@/lib/job-service";
import { Job } from "@/types/job";
import { generateMockJobs } from "@/lib/marketplace-utils";
import { MarketplaceFeed } from "@/components/marketplace";
import { Loader2, Store, Sparkles } from "lucide-react";

export default function MarketplacePage() {
  const { user, profile } = useAuthStore();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // User's skills for AI match scoring
  const userSkills: string[] =
    profile?.role === "student" && (profile as any).skills
      ? (profile as any).skills
      : [];

  React.useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true);
      try {
        // Try fetching published gigs; fall back to rich mock data for demo
        const data = await jobService.getJobs(undefined, true);
        if (data && data.length > 0) {
          setJobs(data);
        } else {
          // Use mock data so the feed is always populated
          setJobs(generateMockJobs());
        }
      } catch {
        setJobs(generateMockJobs());
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-brand-muted font-medium">
            Resolving user session…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink flex items-center gap-2.5">
            <Store className="h-8 w-8 text-brand-ink shrink-0" />
            Job Marketplace
          </h1>
          <p className="mt-1.5 text-sm text-brand-body max-w-xl leading-relaxed">
            Discover live gig opportunities matched to your skills. Powered by
            AI — see your match score, filter by deadline, and apply in seconds.
          </p>
        </div>

        {/* AI Matching badge */}
        <div className="flex items-center gap-2 rounded-[10px] border border-brand-hairline bg-brand-surface-soft px-3.5 py-2.5 shrink-0 self-start">
          <Sparkles className="h-4 w-4 text-brand-info" />
          <div>
            <p className="text-xs font-semibold text-brand-ink leading-none">
              AI Skill Matching
            </p>
            <p className="text-[10px] text-brand-muted font-medium mt-0.5">
              {userSkills.length > 0
                ? `Based on ${userSkills.length} skills in your profile`
                : "Add skills to your profile for better matches"}
            </p>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-brand-hairline" />

      {/* Main Feed */}
      <MarketplaceFeed
        jobs={jobs}
        isLoading={isLoading}
        userSkills={userSkills}
      />
    </div>
  );
}
