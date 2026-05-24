"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface EarningsStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;           // Tailwind bg-* class for the left accent strip
  icon?: React.ReactNode;
  className?: string;
}

export function EarningsStatCard({
  label,
  value,
  sub,
  accent = "bg-brand-peach",
  icon,
  className,
}: EarningsStatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[10px] border border-brand-hairline bg-white px-5 py-5 flex items-start gap-4",
        className
      )}
    >
      {/* Left accent strip */}
      <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-[10px]", accent)} />

      {icon && (
        <div
          className={cn(
            "ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-[8px]",
            accent
          )}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1 ml-2">
        <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted leading-[1.35]">
          {label}
        </p>
       <p className="mt-1 text-[20px] font-normal leading-[1.2] text-brand-ink break-all">
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 text-xs text-brand-muted leading-[1.25]">{sub}</p>
        )}
      </div>
    </div>
  );
}
