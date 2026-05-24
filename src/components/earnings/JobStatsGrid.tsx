"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { JobStatEntry } from "@/types/earnings";

const ACCENT_MAP: Record<string, string> = {
  Applied:   "bg-brand-surface-strong",
  Accepted:  "bg-brand-mint",
  Completed: "bg-brand-peach",
  Rejected:  "bg-brand-cream",
};

interface JobStatsGridProps {
  stats: JobStatEntry[];
}

export function JobStatsGrid({ stats }: JobStatsGridProps) {
  const total = stats.reduce((s, e) => s + e.count, 0);
  return (
    <div className="rounded-[10px] border border-brand-hairline bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-hairline">
        <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted">
          Job Statistics
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-brand-hairline">
        {stats.map((stat) => {
          const pct = total > 0 ? Math.round((stat.count / total) * 100) : 0;
          const accent = ACCENT_MAP[stat.label] ?? "bg-brand-surface-soft";
          return (
            <div key={stat.label} className="px-5 py-4">
              <div
                className={cn("h-8 w-8 rounded-[8px] grid place-items-center mb-3", accent)}
              >
                <span className="text-sm font-semibold text-brand-ink">{stat.count}</span>
              </div>
              <p className="text-sm font-medium text-brand-ink">{stat.label}</p>
              <p className="text-xs text-brand-muted mt-0.5">{pct}% of total</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
