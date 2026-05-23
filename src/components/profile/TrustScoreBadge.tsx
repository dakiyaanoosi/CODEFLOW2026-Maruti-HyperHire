"use client";

import * as React from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustScoreBadgeProps {
  score: number;
  className?: string;
}

function getTrustLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Trusted";
  if (score >= 55) return "Good";
  return "Building";
}

function getTrustColor(score: number): string {
  if (score >= 90) return "bg-brand-success/10 text-brand-success border-brand-success/20";
  if (score >= 75) return "bg-brand-info/10 text-brand-info border-brand-info-border/30";
  if (score >= 55) return "bg-brand-mustard/15 text-[#7a5800] border-brand-mustard/30";
  return "bg-brand-surface-strong text-brand-muted border-brand-hairline";
}

export function TrustScoreBadge({ score, className }: TrustScoreBadgeProps) {
  const label = getTrustLabel(score);
  const colorClass = getTrustColor(score);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium leading-[1.35] tracking-[0.16px]",
        colorClass,
        className
      )}
    >
      <Shield className="h-3 w-3 shrink-0" />
      <span>
        {score} Trust · {label}
      </span>
    </div>
  );
}