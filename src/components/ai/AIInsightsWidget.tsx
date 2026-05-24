"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { Sparkles, ArrowUpRight, HelpCircle } from "lucide-react";
import { StudentProfile } from "@/types/profile";

export function AIInsightsWidget() {
  const { profile } = useAuthStore();

  if (!profile || profile.role !== "student") {
    // For business users, display hiring insights
    return (
      <div className="rounded-[10px] border border-brand-hairline bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-peach/20 text-brand-coral">
            <Sparkles className="h-3 w-3" />
          </div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">AI Market Insights</h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2 border-b border-brand-hairline/60 pb-3">
            <div>
              <p className="text-xs font-bold text-brand-ink">Web Development</p>
              <p className="text-[11px] text-brand-muted">Demand increased by 32% this week</p>
            </div>
            <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              +32%
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 border-b border-brand-hairline/60 pb-3">
            <div>
              <p className="text-xs font-bold text-brand-ink">Video Editing</p>
              <p className="text-[11px] text-brand-muted">Trending category in local hubs</p>
            </div>
            <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              +18%
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-brand-ink">AI Assistant Tip</p>
              <p className="text-[11px] text-brand-muted leading-relaxed">
                Add precise expected deliverables to your listings to increase candidate semantic match scores by up to 25%.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student users: dynamic recommendations based on profile strength and missing fields
  const studProfile = profile as unknown as StudentProfile;
  const suggestions: string[] = [];

  if (!studProfile.bio || studProfile.bio.length < 45) {
    suggestions.push("Elaborate your bio with specific achievements to help the AI semantic matching engine understand your expertise.");
  }
  if (!studProfile.skills || studProfile.skills.length < 4) {
    suggestions.push("List at least 5 technical skills to optimize your matching index for developer listings.");
  }
  if (!studProfile.portfolioLinks || studProfile.portfolioLinks.length === 0) {
    suggestions.push("Upload work files to your Portfolio grid to enable deep AI semantic relevancy scoring.");
  }
  if (studProfile.hourlyRate === 0) {
    suggestions.push("Set a standard hourly rate on your profile page to rank higher in budget compatibility algorithms.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Profile optimized! Your profile has high semantic indexing. Refreshing the dashboard will dynamically match active jobs.");
  }

  const trendingSkills = studProfile.skills.includes("React") 
    ? ["Next.js", "Framer Motion", "Tailwind CSS"]
    : ["Figma", "UI Design", "Adobe Premier"];

  return (
    <div className="rounded-[10px] border border-brand-hairline bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-mint/35 text-brand-success">
          <Sparkles className="h-3 w-3" />
        </div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">AI Profile Optimizer</h4>
      </div>

      <div className="space-y-3.5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Actionable suggestions</p>
          <ul className="mt-2 space-y-2">
            {suggestions.slice(0, 2).map((s, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[11px] text-brand-body leading-[1.4]">
                <HelpCircle className="h-3.5 w-3.5 text-brand-peach shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-brand-hairline/60 pt-3" />

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Demand trend tips</p>
          <p className="text-[11px] text-brand-body leading-relaxed mt-1">
            Jobs in <span className="font-semibold text-brand-ink">{studProfile.preferredCategories[0] || "Web Development"}</span> are trending. Consider adding <span className="font-semibold text-brand-ink">{trendingSkills.slice(0, 2).join(" or ")}</span> to your profile skills.
          </p>
        </div>
      </div>
    </div>
  );
}
