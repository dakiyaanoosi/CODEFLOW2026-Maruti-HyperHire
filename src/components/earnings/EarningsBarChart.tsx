"use client";

/**
 * EarningsBarChart
 * ─────────────────
 * Pure-CSS / SVG bar chart — no charting lib dependency.
 * Accepts an array of { month, amount } entries and renders
 * a simple responsive bar chart matching the design system.
 */

import * as React from "react";

interface BarEntry {
  month: string;
  amount: number;
}

interface EarningsBarChartProps {
  data: BarEntry[];
  accentClass?: string;  // Tailwind fill class for bars
  label?: string;
  unit?: string;         // currency prefix
}

export function EarningsBarChart({
  data,
  accentClass = "fill-brand-ink",
  label = "Monthly Income",
  unit = "₹",
}: EarningsBarChartProps) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const BAR_HEIGHT = 140;

  return (
    <div className="rounded-[10px] border border-brand-hairline bg-white px-5 py-5">
      <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted mb-4">
        {label}
      </p>
      <div className="flex items-end gap-2 h-[160px]">
        {data.map((entry, i) => {
          const barH = Math.round((entry.amount / max) * BAR_HEIGHT);
          const isLast = i === data.length - 1;
          return (
            <div key={entry.month} className="flex flex-1 flex-col items-center gap-1.5 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                              text-[10px] font-semibold text-brand-ink whitespace-nowrap">
                {unit}{entry.amount.toLocaleString()}
              </div>
              {/* Bar */}
              <div
                className={`w-full rounded-t-[4px] transition-all ${
                  isLast ? "bg-brand-ink" : "bg-brand-surface-strong"
                }`}
                style={{ height: barH }}
              />
              {/* Label */}
              <span className={`text-[10px] font-medium leading-[1.35] ${
                isLast ? "text-brand-ink" : "text-brand-muted"
              }`}>
                {entry.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
