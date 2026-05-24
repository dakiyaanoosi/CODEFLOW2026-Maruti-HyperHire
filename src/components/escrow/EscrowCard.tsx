"use client";
import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EscrowStatusBadge } from "./EscrowStatusBadge";
import type { EscrowTransaction } from "@/types/escrow";
interface EscrowCardProps {
  txn: EscrowTransaction;
  onClick: () => void;
  role: "student" | "business";
}
export function EscrowCard({ txn, onClick, role }: EscrowCardProps) {
  const counterparty = role === "business" ? txn.studentName : txn.businessName;
  const counterpartyLabel = role === "business" ? "Assignee" : "Business";
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-4 rounded-[10px] border border-brand-hairline bg-white px-5 py-4",
        "transition-colors hover:border-brand-border-strong hover:bg-brand-surface-soft text-left"
      )}
    >
      {}
      <div className="hidden sm:flex shrink-0 w-[3px] self-stretch rounded-full bg-brand-peach" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-brand-ink leading-[1.4] truncate">{txn.jobTitle}</p>
        <p className="text-xs text-brand-muted leading-[1.25]">
          <span className="text-brand-body">{counterpartyLabel}:</span> {counterparty}
        </p>
      </div>
      <div className="shrink-0 text-right space-y-1">
        <p className="text-sm font-medium text-brand-ink">
          ₹{txn.amount.toLocaleString("en-IN")}
        </p>
        <EscrowStatusBadge status={txn.status} />
      </div>
      <ChevronRight className="shrink-0 h-4 w-4 text-brand-muted group-hover:text-brand-ink transition-colors" />
    </button>
  );
}
