"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface HiringEfficiencyCardProps {
  efficiencyRate: number;  // 0–100
  avgTimeToHire: number;   // days
  hiredCount: number;
  activeProjectCount: number;
}

export function HiringEfficiencyCard({
  efficiencyRate,
  avgTimeToHire,
  hiredCount,
  activeProjectCount,
}: HiringEfficiencyCardProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (efficiencyRate / 100) * circumference;

  return (
    <div className="rounded-[10px] border border-brand-hairline bg-white px-5 py-5">
      <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted mb-4">
        Hiring Efficiency
      </p>
      <div className="flex items-center gap-6">
        {/* Donut gauge */}
        <div className="relative shrink-0 h-24 w-24">
          <svg className="rotate-[-90deg]" viewBox="0 0 96 96" width="96" height="96">
            <circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke="#e0e2e6"
              strokeWidth="10"
            />
            <circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke="#181d26"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-medium text-brand-ink leading-[1.2]">{efficiencyRate}%</span>
            <span className="text-[9px] text-brand-muted tracking-[0.16px] uppercase">Rate</span>
          </div>
        </div>
        {/* Stats list */}
        <div className="grid grid-cols-1 gap-3 flex-1">
          <div>
            <p className="text-xs text-brand-muted">Avg. Time to Hire</p>
            <p className="text-sm font-medium text-brand-ink mt-0.5">{avgTimeToHire} days</p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">Total Hired</p>
            <p className="text-sm font-medium text-brand-ink mt-0.5">{hiredCount} students</p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">Active Projects</p>
            <p className="text-sm font-medium text-brand-ink mt-0.5">{activeProjectCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
