"use client";

import * as React from "react";
import { Sparkles, CheckCircle2, ShieldCheck, TrendingUp, Cpu } from "lucide-react";
import { ScoreBreakdown } from "@/services/ai/types";

interface AIExplanationCardProps {
  reasoning: string;
  breakdown: ScoreBreakdown;
  skillsMatched?: string[];
  experienceLevel?: string;
}

export function AIExplanationCard({
  reasoning,
  breakdown,
  skillsMatched = [],
  experienceLevel,
}: AIExplanationCardProps) {
  const semanticPercentage = Math.round(breakdown.semantic_similarity * 100);
  const trustPercentage = Math.round(breakdown.trust_score * 100);

  return (
    <div className="rounded-[12px] border border-brand-ink/10 bg-brand-cream/15 p-5 space-y-4 shadow-sm relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-brand-peach/10 blur-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 rounded-full bg-brand-yellow/10 blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-ink text-white">
          <Sparkles className="h-3 w-3 animate-pulse" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-ink">
          AI Recommendation Logic
        </span>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-brand-muted">
          <Cpu className="h-3 w-3 text-brand-muted/70" />
          all-MiniLM-L6-v2
        </span>
      </div>

      {/* Main explanation paragraph */}
      <div className="text-sm font-medium leading-[1.65] text-brand-ink bg-white/50 border border-brand-hairline/60 rounded-[8px] p-3.5 shadow-xs">
        {reasoning}
      </div>

      {/* Grid of validation factor badges */}
      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
        <div className="flex items-center gap-2 rounded-[8px] bg-white border border-brand-hairline p-2">
          <TrendingUp className="h-3.5 w-3.5 text-brand-peach shrink-0" />
          <div>
            <p className="text-[9px] uppercase tracking-wider text-brand-muted leading-none font-bold">Semantic fit</p>
            <p className="text-brand-ink mt-0.5">{semanticPercentage}% compatibility</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-[8px] bg-white border border-brand-hairline p-2">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-mint shrink-0" />
          <div>
            <p className="text-[9px] uppercase tracking-wider text-brand-muted leading-none font-bold">Marketplace trust</p>
            <p className="text-brand-ink mt-0.5">{trustPercentage}% trust index</p>
          </div>
        </div>

        {experienceLevel && (
          <div className="flex items-center gap-2 rounded-[8px] bg-white border border-brand-hairline p-2 col-span-2 sm:col-span-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-yellow shrink-0" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-brand-muted leading-none font-bold">Experience fit</p>
              <p className="text-brand-ink mt-0.5">{experienceLevel} aligned</p>
            </div>
          </div>
        )}

        {skillsMatched.length > 0 && (
          <div className="flex items-center gap-2 rounded-[8px] bg-white border border-brand-hairline p-2 col-span-2 sm:col-span-1">
            <Sparkles className="h-3.5 w-3.5 text-brand-mustard shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-wider text-brand-muted leading-none font-bold">Matched skills</p>
              <p className="text-brand-ink mt-0.5 truncate">{skillsMatched.join(", ")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
