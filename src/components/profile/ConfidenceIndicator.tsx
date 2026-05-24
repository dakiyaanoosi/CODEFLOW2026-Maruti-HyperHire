"use client";

import * as React from "react";
import { TrustRank } from "@/types/trust";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  score: number;
  rank: TrustRank;
  className?: string;
}

export function ConfidenceIndicator({ score, rank, className }: ConfidenceIndicatorProps) {
  let indicatorColor = "bg-brand-muted";
  let label = "Unknown";

  if (score >= 90) {
    indicatorColor = "bg-brand-success";
    label = "High Confidence";
  } else if (score >= 70) {
    indicatorColor = "bg-blue-500";
    label = "Trusted";
  } else if (score >= 50) {
    indicatorColor = "bg-brand-warning";
    label = "Needs Review";
  } else {
    indicatorColor = "bg-brand-coral";
    label = "Low Confidence";
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className={cn("w-2 h-2 rounded-full", indicatorColor)} />
      <span className="text-xs font-semibold text-brand-ink">
        {label}
      </span>
      <span className="text-[11px] text-brand-muted">
        · {rank} Level
      </span>
    </div>
  );
}
