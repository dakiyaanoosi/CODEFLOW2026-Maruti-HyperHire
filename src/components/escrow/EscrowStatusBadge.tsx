"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { EscrowStatus } from "@/types/escrow";
const STATUS_MAP: Record<
  EscrowStatus,
  { label: string; className: string }
> = {
  pending_funding:      { label: "Pending Funding",      className: "bg-brand-surface-soft text-brand-muted border-brand-hairline" },
  funded:               { label: "Funded",               className: "bg-brand-yellow/20 text-brand-mustard border-brand-mustard/30" },
  eligible_for_release: { label: "Eligible for Release", className: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
  released:             { label: "Released",             className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  disputed:             { label: "Disputed",             className: "bg-brand-coral/15 text-brand-coral border-brand-coral/30 font-semibold" },
  cancelled:            { label: "Cancelled",            className: "bg-brand-surface-soft text-brand-muted border-brand-hairline opacity-60" },
};
interface EscrowStatusBadgeProps {
  status: EscrowStatus;
  className?: string;
}
export function EscrowStatusBadge({ status, className }: EscrowStatusBadgeProps) {
  const cfg = STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] border px-2 py-0.5 text-xs font-medium leading-[1.35] tracking-[0.16px]",
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
