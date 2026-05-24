"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { EscrowStatus } from "@/types/escrow";
const STATUS_MAP: Record<
  EscrowStatus,
  { label: string; className: string }
> = {
  funded:    { label: "Funded",      className: "bg-brand-yellow/20 text-brand-mustard border-brand-mustard/30" },
  in_review: { label: "In Review",   className: "bg-[#254fad]/10 text-brand-info border-[#458fff]/30" },
  approved:  { label: "Approved",    className: "bg-brand-mint/20 text-brand-success border-brand-success/30" },
  released:  { label: "Released",    className: "bg-[#0a2e0e]/10 text-[#0a2e0e] border-[#0a2e0e]/20" },
  disputed:  { label: "Disputed",    className: "bg-brand-coral/10 text-brand-coral border-brand-coral/30" },
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
