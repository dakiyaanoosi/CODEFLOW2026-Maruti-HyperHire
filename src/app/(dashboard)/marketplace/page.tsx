"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { jobService } from "@/lib/job-service";
import { Job } from "@/types/job";
import { generateMockJobs } from "@/lib/marketplace-utils";
import { MarketplaceFeed } from "@/components/marketplace";
import { Loader2, Store, Target } from "lucide-react";
import { portfolioService } from "@/lib/portfolio-service";
import { aiService } from "@/services/ai/service";

export default function MarketplacePage() {
  const { user, profile } = useAuthStore();
  const { setContext } = useHyperAIStore();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAIActive, setIsAIActive] = React.useState(false);

  const userSkills: string[] =
    profile?.role === "student" && profile.skills
      ? profile.skills
      : [];

  React.useEffect(() => {
    async function fetchAndMatchJobs() {
      if (!user?.uid || !profile) return;
      setIsLoading(true);
      try {
        const rawJobs = await jobService.getJobs(undefined, true);
        const activeJobs = rawJobs || [];
        
        if (profile.role === "student") {
          try {
            // Fetch portfolios
            const portfolios = await portfolioService.getPortfolios(user.uid);
            // Query FastAPI AI Engine recommend endpoint
            const aiRes = await aiService.recommendJobsForStudent({
              id: user.uid,
              profile: profile as any,
              portfolios,
            }, activeJobs);
            
            // Map real AI scores back to the jobs list
            const matchedJobs = activeJobs.map(job => {
              const recommendation = aiRes.ranked_jobs.find(rj => rj.job_id === job.jobId);
              return {
                ...job,
                matchScore: recommendation ? recommendation.match_percentage : 0,
                aiReasoning: recommendation ? recommendation.reasoning : "",
                aiBreakdown: recommendation ? recommendation.breakdown : undefined,
                aiConfidence: recommendation ? recommendation.confidence_score : undefined,
              };
            });
            
            setJobs(matchedJobs);
            setIsAIActive(true);

            // ── HyperAI context injection ────────────────────────────────
            // Push student profile + portfolio + top match recommendation
            const topMatch = aiRes.ranked_jobs[0];
            const topJob = matchedJobs.find(j => j.jobId === topMatch?.job_id);
            setContext({
              activeProfile: profile,
              activePortfolio: portfolios,
              activeJob: topJob ?? null,
              recommendationState: topMatch ? {
                match_percentage: topMatch.match_percentage,
                confidence_score: topMatch.confidence_score,
                breakdown: topMatch.breakdown,
                reasoning: topMatch.reasoning,
              } : null,
            });

          } catch (aiErr) {
            console.warn("FastAPI AI Engine not accessible, using fallback skill match.", aiErr);
            setJobs(activeJobs);
            setIsAIActive(false);
          }
        } else {
          setJobs(activeJobs);
        }
      } catch (err) {
        console.error("Error fetching marketplace jobs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAndMatchJobs();
  }, [user, profile]);

  if (!user || !profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-brand-muted font-medium">Resolving user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="flex items-center gap-2.5 text-[32px] font-normal leading-[1.2] text-brand-ink">
            <Store className="h-8 w-8 shrink-0 text-brand-ink" />
            Job Marketplace
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-brand-body">
            Discover live gig opportunities, compare skill fit, filter by deadline, and apply in seconds.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start rounded-[10px] border border-brand-hairline bg-brand-surface-soft px-3.5 py-2.5">
          <Target className="h-4 w-4 text-brand-info" />
          <div>
            <p className="text-xs font-semibold leading-none text-brand-ink">
              {isAIActive ? "AI Semantic Matching" : "Skill Fit Overlap"}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-brand-muted">
              {isAIActive
                ? "Running vector cosine similarity"
                : userSkills.length > 0
                ? `Based on ${userSkills.length} skills in your profile`
                : "Add skills to your profile for better results"}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-hairline" />

      <MarketplaceFeed jobs={jobs} isLoading={isLoading} userSkills={userSkills} />
    </div>
  );
}
