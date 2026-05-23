"use client";

import * as React from "react";
import { ApplicationStatus } from "@/types/application";
import { cn } from "@/lib/utils";

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  size?: "sm" | "md";
}

const CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  Pending: {
    label: "Pending",
    className: "bg-brand-surface-strong text-brand-muted border-brand-hairline",
  },
  Shortlisted: {
    label: "Shortlisted",
    className: "bg-[#f4d35e]/20 text-[#a07000] border-[#f4d35e]/50",
  },
  Accepted: {
    label: "Accepted",
    className: "bg-brand-success/10 text-brand-success border-brand-success/20",
  },
  Rejected: {
    label: "Rejected",
    className: "bg-brand-coral/10 text-brand-coral border-brand-coral/20",
  },
};

export function ApplicationStatusBadge({ status, size = "md" }: ApplicationStatusBadgeProps) {
  const cfg = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] border font-semibold uppercase tracking-wider font-mono",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}
