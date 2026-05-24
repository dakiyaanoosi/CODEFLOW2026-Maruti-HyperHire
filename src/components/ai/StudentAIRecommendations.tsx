"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { jobService } from "@/lib/job-service";
import { portfolioService } from "@/lib/portfolio-service";
import { aiService } from "@/services/ai/service";
import { JobScoreResponse } from "@/services/ai/types";
import { StudentProfile } from "@/types/profile";
import { AISkeletonLoader } from "./AISkeletonLoader";
import { AIExplanationCard } from "./AIExplanationCard";
import { AIMatchVisualization } from "./AIMatchVisualization";
import { Briefcase, Sparkles, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

export function StudentAIRecommendations() {
  const { user, profile } = useAuthStore();
  const [recommendations, setRecommendations] = React.useState<JobScoreResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    async function loadRecommendations() {
      if (!user?.uid || !profile) return;
      setLoading(true);
      setError(null);
      try {
        const toStudentProfile = (): StudentProfile | null => {
          if (!profile || profile.role !== "student") return null;
          return {
            name: profile.name,
            college: profile.college ?? "",
            bio: profile.bio ?? "",
            skills: profile.skills ?? [],
            experienceLevel: profile.experienceLevel ?? "Beginner",
            availability: profile.availability ?? "",
            preferredCategories: profile.preferredCategories ?? [],
            hourlyRate: profile.hourlyRate ?? 0,
            portfolioLinks: profile.portfolioLinks ?? [],
            socialLinks: profile.socialLinks ?? {},
            trustScore: profile.trustScore ?? 0,
            isVerified: profile.verificationStatus === "Verified",
            profileStrength: profile.profileStrength ?? 0,
            avatarInitials: profile.avatarInitials ?? profile.name.slice(0, 2).toUpperCase(),
            avatarUrl: profile.avatarUrl ?? "",
          };
        };

        const portfolios = await portfolioService.getPortfolios(user.uid);
        const jobs = await jobService.getJobs(undefined, true);
        
        if (jobs.length === 0) {
          setRecommendations([]);
          return;
        }

        const studentProfile = toStudentProfile();
        if (!studentProfile) {
          setRecommendations([]);
          return;
        }

        const res = await aiService.recommendJobsForStudent({
          id: user.uid,
          profile: studentProfile,
          portfolios,
        }, jobs);
        
        setRecommendations(res.ranked_jobs);
      } catch (err: unknown) {
        console.error("AI recommendations fetch error:", err);
        setError("Could not connect to the AI matching server. Make sure the backend AI service is online.");
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [user, profile]);

  if (loading) {
    return <AISkeletonLoader message="Generating customized job recommendations..." />;
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-brand-coral/20 bg-brand-coral/5 p-5 text-sm text-brand-coral flex gap-2.5 items-start">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">AI Matching Unavailable</p>
          <p className="mt-1 text-xs text-brand-body leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="rounded-[12px] border border-brand-hairline bg-white p-6 text-center text-brand-muted space-y-2">
        <Briefcase className="h-8 w-8 mx-auto text-brand-hairline" />
        <p className="text-xs font-semibold text-brand-ink">No recommendations found</p>
        <p className="text-[11px]">Check back later once new gig listings are published.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-mustard" />
        <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wider">
          AI Recommended Gigs
        </h3>
        <span className="ml-auto rounded-full bg-brand-mint/20 px-2 py-0.5 text-[10px] font-bold text-brand-success">
          Sorted by Relevancy
        </span>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec, idx) => {
          const isExpanded = expandedIndex === idx;
          const matchingSkills = rec.breakdown.skill_overlap > 0 
            ? profile?.skills?.filter((s: string) => s.toLowerCase().includes("react") || s.toLowerCase().includes("typescript") || s.toLowerCase().includes("tailwind")) || []
            : [];

          return (
            <div
              key={rec.job_id}
              className="rounded-[10px] border border-brand-hairline bg-white p-4 shadow-sm space-y-3 transition-colors hover:border-brand-border-strong"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-brand-ink">{rec.title}</h4>
                  <p className="text-xs text-brand-muted mt-0.5">{rec.company_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-ink px-2.5 py-0.5 text-xs font-bold text-white">
                    {rec.match_percentage}% Match
                  </span>
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="p-1 text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isExpanded && (
                <div className="flex items-center justify-between text-[11px] text-brand-muted">
                  <p className="truncate pr-4 max-w-[70%]">{rec.reasoning}</p>
                  <span className="text-brand-muted/80 shrink-0">Use the chevron to view details</span>
                </div>
              )}

              {isExpanded && (
                <div className="space-y-4 pt-2 border-t border-brand-hairline/60">
                  <AIMatchVisualization
                    matchPercentage={rec.match_percentage}
                    confidenceScore={rec.confidence_score}
                    breakdown={rec.breakdown}
                  />
                  <AIExplanationCard
                    reasoning={rec.reasoning}
                    breakdown={rec.breakdown}
                    skillsMatched={matchingSkills}
                    experienceLevel={profile?.experienceLevel}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
