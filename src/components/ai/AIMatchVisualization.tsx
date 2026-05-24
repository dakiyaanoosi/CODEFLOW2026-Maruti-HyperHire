"use client";

import * as React from "react";
import { ScoreBreakdown } from "@/services/ai/types";
import { motion } from "framer-motion";
import { Star, Code, Compass, Zap, Activity, Award } from "lucide-react";

interface AIMatchVisualizationProps {
  matchPercentage: number;
  confidenceScore: number;
  breakdown: ScoreBreakdown;
  compact?: boolean;
}

export function AIMatchVisualization({
  matchPercentage,
  confidenceScore,
  breakdown,
  compact = false,
}: AIMatchVisualizationProps) {
  // Circular progress math
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchPercentage / 100) * circumference;

  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return { label: "High Confidence", color: "bg-green-500/10 text-green-700 border-green-500/20" };
    if (score >= 0.5) return { label: "Medium Confidence", color: "bg-brand-yellow/10 text-brand-mustard border-brand-yellow/20" };
    return { label: "Lower Confidence", color: "bg-brand-coral/10 text-brand-coral border-brand-coral/20" };
  };

  const confidence = getConfidenceLevel(confidenceScore);

  const stats = [
    { label: "Semantic match", val: breakdown.semantic_similarity, color: "bg-brand-peach", icon: Activity },
    { label: "Skill overlap", val: breakdown.skill_overlap, color: "bg-brand-mint", icon: Code },
    { label: "Portfolio relevance", val: breakdown.portfolio_relevance, color: "bg-brand-yellow", icon: Award },
    { label: "Trust score", val: breakdown.trust_score, color: "bg-sky-400", icon: Star },
    { label: "Experience match", val: breakdown.experience_level, color: "bg-purple-400", icon: Zap },
    { label: "Category align", val: breakdown.category_alignment, color: "bg-brand-link", icon: Compass },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {/* Simple Circle */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="h-14 w-14 transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="22"
              className="stroke-brand-surface-strong fill-none"
              strokeWidth="3.5"
            />
            <motion.circle
              cx="28"
              cy="28"
              r="22"
              className="stroke-brand-ink fill-none"
              strokeWidth="3.5"
              strokeDasharray={2 * Math.PI * 22}
              initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 22 - (matchPercentage / 100) * 2 * Math.PI * 22 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[10px] font-bold text-brand-ink">{matchPercentage}%</span>
        </div>
        <div className="space-y-1">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${confidence.color}`}>
            {confidence.label}
          </span>
          <p className="text-[11px] text-brand-muted font-medium">
            Semantic match: {Math.round(breakdown.semantic_similarity * 100)}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-brand-hairline bg-brand-surface-soft p-5 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">AI Matching Core</h4>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${confidence.color}`}>
            {confidence.label}
          </span>
        </div>

        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center h-20 w-20 shrink-0">
          <svg className="h-20 w-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-brand-surface-strong fill-none"
              strokeWidth={strokeWidth}
            />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-brand-ink fill-none"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-brand-ink leading-none">{matchPercentage}%</span>
            <span className="text-[8px] uppercase tracking-wider text-brand-muted font-semibold mt-0.5">Match</span>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-hairline/60" />

      {/* Breakdowns */}
      <div className="grid grid-cols-2 gap-3.5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-brand-muted">
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3 shrink-0 text-brand-muted/70" />
                  {s.label}
                </span>
                <span className="font-semibold text-brand-ink">{Math.round(s.val * 100)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-brand-surface-strong overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${s.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.val * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
