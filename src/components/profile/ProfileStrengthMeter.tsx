"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProfileStrengthMeterProps {
  strength: number;
  className?: string;
}

function getStrengthLabel(s: number) {
  if (s >= 90) return { label: "Complete", color: "bg-brand-success" };
  if (s >= 70) return { label: "Strong", color: "bg-brand-info" };
  if (s >= 45) return { label: "Good", color: "bg-brand-mustard" };
  return { label: "Starter", color: "bg-brand-border-strong" };
}

export function ProfileStrengthMeter({ strength, className }: ProfileStrengthMeterProps) {
  const { label, color } = getStrengthLabel(strength);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium leading-[1.35] text-brand-body">
          Profile Strength
        </span>
        <span className="text-[13px] font-medium leading-[1.35] text-brand-muted">
          {strength}% · {label}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-surface-strong">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${strength}%` }}
        />
      </div>
    </div>
  );
}