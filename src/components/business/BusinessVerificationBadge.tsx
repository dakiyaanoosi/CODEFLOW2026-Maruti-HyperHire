"use client";

import * as React from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessVerificationBadgeProps {
  isVerified: boolean;
  className?: string;
}

export function BusinessVerificationBadge({
  isVerified,
  className,
}: BusinessVerificationBadgeProps) {
  if (!isVerified) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-brand-hairline bg-brand-surface-soft px-2.5 py-1 text-xs font-medium text-brand-muted",
          className
        )}
      >
        Unverified
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand-info-border/30 bg-brand-info/10 px-2.5 py-1 text-xs font-medium text-brand-info",
        className
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
      Verified Business
    </span>
  );
}
