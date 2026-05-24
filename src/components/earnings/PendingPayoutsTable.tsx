"use client";

import * as React from "react";
import { Clock, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendingPayout } from "@/types/earnings";

const STATUS_CONFIG: Record<
  PendingPayout["status"],
  { label: string; icon: React.ElementType; className: string }
> = {
  Pending:    { label: "Pending",    icon: Clock,        className: "text-brand-mustard" },
  Processing: { label: "Processing", icon: Loader2,      className: "text-brand-info" },
  Released:   { label: "Released",   icon: CheckCircle,  className: "text-brand-success" },
};

interface PendingPayoutsTableProps {
  payouts: PendingPayout[];
}

export function PendingPayoutsTable({ payouts }: PendingPayoutsTableProps) {
  if (!payouts.length) {
    return (
      <div className="rounded-[10px] border border-brand-hairline bg-white px-5 py-10 text-center">
        <p className="text-sm text-brand-muted">No pending payouts — you're all settled!</p>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-brand-hairline bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-hairline">
        <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted">
          Pending Payouts
        </p>
      </div>
      <div className="divide-y divide-brand-hairline">
        {payouts.map((p) => {
          const cfg = STATUS_CONFIG[p.status];
          const StatusIcon = cfg.icon;
          return (
            <div key={p.payoutId} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-ink truncate">{p.jobTitle}</p>
                <p className="text-xs text-brand-muted mt-0.5">{p.businessName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-brand-ink">₹{p.amount.toLocaleString()}</p>
                <p className="text-xs text-brand-muted mt-0.5">
                  Due {new Date(p.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <div className={cn("flex items-center gap-1.5 shrink-0 w-24 justify-end", cfg.className)}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
