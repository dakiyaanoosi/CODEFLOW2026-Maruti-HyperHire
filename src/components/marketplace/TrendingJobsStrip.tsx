"use client";

import * as React from "react";
import { Flame } from "lucide-react";
import { JobWithMatchScore } from "@/types/marketplace";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrendingJobsStripProps {
  jobs: JobWithMatchScore[];
  onJobClick: (job: JobWithMatchScore) => void;
}

export function TrendingJobsStrip({ jobs, onJobClick }: TrendingJobsStripProps) {
  const trending = jobs
    .filter((j) => j.isTrending)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  if (trending.length === 0) return null;

  const categoryColors: Record<string, string> = {
    "Web Development": "bg-[#254fad]/10 text-[#254fad] border-[#254fad]/20",
    "Machine Learning": "bg-[#aa2d00]/10 text-[#aa2d00] border-[#aa2d00]/20",
    "UI/UX Design": "bg-[#0a2e0e]/10 text-[#006400] border-[#0a2e0e]/20",
    "Data Science": "bg-[#d9a441]/15 text-[#8a6200] border-[#d9a441]/30",
    "Mobile Development": "bg-[#fcab79]/20 text-[#7a3a00] border-[#fcab79]/40",
  };

  return (
    <div className="rounded-[12px] border border-brand-hairline bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-brand-hairline bg-brand-surface-soft">
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-[#aa2d00]" />
          <span className="text-sm font-semibold text-brand-ink">Trending Now</span>
        </div>
        <span className="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
          · Hot in your field
        </span>
      </div>

      {/* Horizontal scroll strip */}
      <div className="flex gap-3 p-4 overflow-x-auto scrollbar-none">
        {trending.map((job, idx) => (
          <motion.button
            key={job.jobId}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.07 }}
            onClick={() => onJobClick(job)}
            className="flex items-center gap-3 rounded-[10px] border border-brand-hairline bg-white px-4 py-3 shrink-0 text-left hover:border-brand-border-strong hover:shadow-sm transition-all group"
            style={{ minWidth: 240 }}
          >
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-xs font-semibold text-brand-ink group-hover:text-brand-link transition-colors line-clamp-1">
                {job.title}
              </span>
              <span className="text-[10px] text-brand-muted font-medium line-clamp-1">
                {job.companyName}
              </span>
              <span
                className={cn(
                  "mt-1 self-start rounded-[4px] border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  categoryColors[job.category] ||
                    "bg-brand-surface-soft text-brand-muted border-brand-hairline"
                )}
              >
                {job.category}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[11px] font-bold text-brand-ink">
                ${job.budget.toLocaleString()}
              </span>
              <div
                className="text-[10px] font-bold"
                style={{
                  color:
                    job.matchScore >= 80
                      ? "#006400"
                      : job.matchScore >= 60
                      ? "#254fad"
                      : "#d9a441",
                }}
              >
                {job.matchScore}% fit
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
