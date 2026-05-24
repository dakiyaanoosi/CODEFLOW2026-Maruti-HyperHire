"use client";
import * as React from "react";
import { Banknote, CheckCircle2, Clock, Wallet } from "lucide-react";
import { EarningsStatCard } from "@/components/earnings/EarningsStatCard";
import type { EscrowSummary } from "@/types/escrow";
interface EscrowSummaryCardsProps {
  summary: EscrowSummary;
  role: "student" | "business";
}
export function EscrowSummaryCards({ summary, role }: EscrowSummaryCardsProps) {
  const isBusiness = role === "business";
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <EarningsStatCard
        label={isBusiness ? "Total Funded" : "Total Escrowed"}
        value={"₹" + summary.totalFunded.toLocaleString("en-IN")}
        sub="All active + closed"
        accent="bg-brand-peach"
        icon={<Banknote className="h-4 w-4 text-brand-ink" />}
      />
      <EarningsStatCard
        label="Funds Released"
        value={"₹" + summary.totalReleased.toLocaleString("en-IN")}
        sub="Net of platform fee"
        accent="bg-brand-mint"
        icon={<CheckCircle2 className="h-4 w-4 text-brand-ink" />}
      />
      <EarningsStatCard
        label="Pending Approval"
        value={String(summary.pendingApproval)}
        sub="Awaiting your review"
        accent="bg-brand-yellow"
        icon={<Clock className="h-4 w-4 text-brand-ink" />}
      />
      <EarningsStatCard
        label={isBusiness ? "Active Escrows" : "Open Contracts"}
        value={String(summary.transactions.filter((t) => t.status !== "released").length)}
        sub="In progress"
        accent="bg-brand-cream"
        icon={<Wallet className="h-4 w-4 text-brand-ink" />}
      />
    </div>
  );
}
