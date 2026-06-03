"use client";

import * as React from "react";
import {
  Briefcase,
  Calendar,
  MapPin,
  IndianRupee,
  Flame,
  Clock,
  Zap,
} from "lucide-react";
import { JobWithMatchScore } from "@/types/marketplace";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MarketplaceJobCardProps {
  job: JobWithMatchScore;
  index: number;
  onClick: () => void;
  userSkills?: string[];
}

function MatchRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "#006400"
      : score >= 60
      ? "#254fad"
      : score >= 40
      ? "#d9a441"
      : "#aa2d00";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
      <svg width="48" height="48" className="-rotate-90" viewBox="0 0 48 48">
        {/* Background track */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#e0e2e6"
          strokeWidth="3.5"
        />
        {/* Progress arc */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span
        className="absolute text-[10px] font-bold leading-none"
        style={{ color }}
      >
        {score}
        <span className="text-[7px] font-semibold">%</span>
      </span>
    </div>
  );
}

export function MarketplaceJobCard({
  job,
  index,
  onClick,
  userSkills = [],
}: MarketplaceJobCardProps) {
  const [now] = React.useState(() => Date.now());
  const formattedDeadline = new Date(job.deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const daysLeft = Math.ceil(
    (new Date(job.deadline).getTime() - now) / (1000 * 60 * 60 * 24)
  );

  const deadlineUrgency =
    daysLeft <= 5 ? "urgent" : daysLeft <= 14 ? "soon" : "normal";

  const difficultyConfig = {
    Beginner: {
      bg: "bg-[#0a2e0e]/8",
      text: "text-[#006400]",
      border: "border-[#006400]/20",
    },
    Intermediate: {
      bg: "bg-[#254fad]/8",
      text: "text-[#254fad]",
      border: "border-[#254fad]/20",
    },
    Advanced: {
      bg: "bg-[#aa2d00]/8",
      text: "text-[#aa2d00]",
      border: "border-[#aa2d00]/20",
    },
  };

  const diff = difficultyConfig[job.difficultyLevel];

  // Highlight matched skills
  const matchedSkills = userSkills.length
    ? job.requiredSkills.filter((s) =>
        userSkills.some(
          (us) =>
            us.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(us.toLowerCase())
        )
      )
    : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.05, 0.3) }}
      onClick={onClick}
      className="group relative flex flex-col rounded-[12px] border border-brand-hairline bg-white cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-brand-border-strong"
    >
      {/* Accent top bar based on skill fit */}
      <div
        className="h-[3px] w-full transition-all duration-300"
        style={{
          background:
            job.matchScore >= 80
              ? "#006400"
              : job.matchScore >= 60
              ? "#254fad"
              : job.matchScore >= 40
              ? "#d9a441"
              : "#e0e2e6",
        }}
      />

      <div className="flex flex-col gap-3.5 p-5">
        {/* Top row: category + badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[120px]">{job.category}</span>
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {job.isNew && (
              <span className="flex items-center gap-1 rounded-[5px] bg-[#254fad]/10 border border-[#254fad]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#254fad]">
                <Zap className="h-2.5 w-2.5" />
                New
              </span>
            )}
            {job.isTrending && (
              <span className="flex items-center gap-1 rounded-[5px] bg-[#aa2d00]/8 border border-[#aa2d00]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#aa2d00]">
                <Flame className="h-2.5 w-2.5" />
                Hot
              </span>
            )}
            <span
              className={cn(
                "rounded-[5px] border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                diff.bg,
                diff.text,
                diff.border
              )}
            >
              {job.difficultyLevel}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold leading-[1.35] text-brand-ink group-hover:text-brand-link transition-colors line-clamp-2">
          {job.title}
        </h3>

        {/* Company + Work Mode */}
        <div className="flex items-center gap-2 text-xs text-brand-muted">
          <span className="font-medium text-brand-body truncate">{job.companyName}</span>
          <span className="h-1 w-1 rounded-full bg-brand-hairline shrink-0" />
          <span className="flex items-center gap-1 font-medium shrink-0">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {job.workMode}
          </span>
        </div>

        {/* Skills */}
        {job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.requiredSkills.slice(0, 4).map((skill) => {
              const isMatched = matchedSkills.includes(skill);
              return (
                <span
                  key={skill}
                  className={cn(
                    "rounded-[5px] px-2 py-0.5 text-[10px] font-medium border transition-colors",
                    isMatched
                      ? "bg-[#006400]/8 text-[#006400] border-[#006400]/25"
                      : "bg-brand-surface-soft text-brand-muted border-brand-hairline/60"
                  )}
                >
                  {isMatched && "✓ "}
                  {skill}
                </span>
              );
            })}
            {job.requiredSkills.length > 4 && (
              <span className="rounded-[5px] bg-brand-surface-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-muted border border-brand-hairline/60">
                +{job.requiredSkills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer: Budget, Deadline, Fit Ring */}
        <div className="mt-auto pt-4 border-t border-brand-hairline/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Budget */}
            <div className="flex items-center text-brand-ink">
              <IndianRupee className="h-3.5 w-3.5 text-brand-muted -ml-0.5 shrink-0" />
              <span className="text-sm font-bold">{job.budget.toLocaleString()}</span>
            </div>

            {/* Deadline */}
            <div
              className={cn(
                "flex items-center gap-1 text-[11px] font-semibold",
                deadlineUrgency === "urgent"
                  ? "text-[#aa2d00]"
                  : deadlineUrgency === "soon"
                  ? "text-brand-mustard"
                  : "text-brand-muted"
              )}
            >
              {deadlineUrgency === "urgent" ? (
                <Clock className="h-3 w-3 shrink-0" />
              ) : (
                <Calendar className="h-3 w-3 shrink-0" />
              )}
              <span>
                {deadlineUrgency === "urgent"
                  ? `${daysLeft}d left`
                  : `Due ${formattedDeadline}`}
              </span>
            </div>
          </div>

          {/* Skill fit ring */}
          <div className="flex flex-col items-center shrink-0">
            <MatchRing score={job.matchScore} />
            <span className="text-[8px] font-semibold text-brand-muted mt-0.5 uppercase tracking-wide">
              Fit
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
