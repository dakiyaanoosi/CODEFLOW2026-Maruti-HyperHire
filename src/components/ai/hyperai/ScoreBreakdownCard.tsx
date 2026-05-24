"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface ScoreBarProps {
  label: string;
  value: string; // e.g. "72%" or "0.72"
  colorClass: string; // tailwind bg class
}

function ScoreBar({ label, value, colorClass }: ScoreBarProps) {
  // Parse pct from "72%" or "0.72"
  let pct = 0;
  if (value.endsWith("%")) {
    pct = parseFloat(value);
  } else {
    const num = parseFloat(value);
    pct = !isNaN(num) && num <= 1 ? num * 100 : num;
  }
  const clamped = Math.max(0, Math.min(100, pct));

  const getColor = () => {
    if (clamped >= 75) return "bg-brand-success";
    if (clamped >= 50) return "bg-brand-mustard";
    return "bg-brand-coral";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-muted leading-none">
          {label}
        </span>
        <span className="text-[10px] font-medium text-brand-ink leading-none">
          {value}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-brand-surface-strong overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        />
      </div>
    </div>
  );
}

interface ScoreBreakdownCardProps {
  highlights: Record<string, any>;
}

export function ScoreBreakdownCard({ highlights }: ScoreBreakdownCardProps) {
  const entries = Object.entries(highlights);
  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3 rounded-[10px] border border-brand-hairline bg-brand-surface-soft overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-brand-hairline px-3 py-2 bg-brand-surface-strong/60">
        <div className="h-2 w-2 rounded-full bg-brand-success" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-ink">
          AI Score Breakdown
        </span>
      </div>

      {/* Bars */}
      <div className="px-3 py-3 space-y-2.5">
        {entries.map(([key, val]) => (
          <ScoreBar
            key={key}
            label={key}
            value={String(val)}
            colorClass=""
          />
        ))}
      </div>

      {/* Footer explainer */}
      <div className="border-t border-brand-hairline px-3 py-2 bg-white">
        <p className="text-[9px] text-brand-muted leading-[1.4]">
          Scores calculated by the HyperHire AI engine using semantic embeddings, skill matching, trust analysis, and portfolio relevance.
        </p>
      </div>
    </motion.div>
  );
}
