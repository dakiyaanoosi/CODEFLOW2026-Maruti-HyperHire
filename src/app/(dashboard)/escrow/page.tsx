"use client";
import * as React from "react";
import { Shield, BarChart2 } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import {
  EscrowSummaryCards,
  EscrowCard,
  EscrowDetailPanel,
} from "@/components/escrow";
import { getEscrowSummary } from "@/lib/escrow-service";
import type { EscrowSummary, EscrowTransaction, EscrowStatus } from "@/types/escrow";
const FILTER_TABS: { label: string; value: EscrowStatus | "all" }[] = [
  { label: "All",        value: "all" },
  { label: "Funded",     value: "funded" },
  { label: "In Review",  value: "in_review" },
  { label: "Approved",   value: "approved" },
  { label: "Released",   value: "released" },
];
export default function EscrowPage() {
  const { user, profile } = useAuthStore();
  const role = profile?.role === "business" ? "business" : "student";
  const [summary, setSummary] = React.useState<EscrowSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<EscrowStatus | "all">("all");
  const [selected, setSelected] = React.useState<EscrowTransaction | null>(null);
  React.useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    getEscrowSummary(user.uid, role)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [user?.uid, role]);
  const handleUpdate = (updated: EscrowTransaction) => {
    setSummary((prev) => {
      if (!prev) return prev;
      const txns = prev.transactions.map((t) =>
        t.escrowId === updated.escrowId ? updated : t
      );
      return {
        ...prev,
        totalReleased: txns
          .filter((t) => t.status === "released")
          .reduce((s, t) => s + t.netPayout, 0),
        pendingApproval: txns.filter((t) => t.status === "in_review").length,
        inReview: txns.filter((t) => t.status === "in_review").length,
        transactions: txns,
      };
    });
    setSelected(updated);
  };
  const filtered = summary?.transactions.filter(
    (t) => filter === "all" || t.status === filter
  ) ?? [];
  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink">
          Escrow
        </h1>
        <p className="mt-2 text-sm text-brand-body leading-[1.25]">
          {role === "business"
            ? "Review delivered work, approve quality, and release funds securely."
            : "Track your contracts, submit deliverables, and receive payments."}
        </p>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border border-brand-hairline bg-white py-24 gap-3">
          <BarChart2 className="h-6 w-6 text-brand-muted" />
          <p className="text-sm text-brand-muted">Loading escrow data…</p>
        </div>
      ) : summary ? (
        <>
          {}
          <EscrowSummaryCards summary={summary} role={role} />
          {}
          <div className="space-y-4">
            {}
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.value === "all"
                    ? summary.transactions.length
                    : summary.transactions.filter((t) => t.status === tab.value).length;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={
                      filter === tab.value
                        ? "inline-flex items-center gap-1.5 rounded-[8px] bg-brand-ink px-3 py-1.5 text-xs font-medium text-white"
                        : "inline-flex items-center gap-1.5 rounded-[8px] border border-brand-hairline bg-white px-3 py-1.5 text-xs font-medium text-brand-muted hover:text-brand-ink transition-colors"
                    }
                  >
                    {tab.label}
                    <span
                      className={
                        filter === tab.value
                          ? "rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          : "rounded-full bg-brand-surface-strong px-1.5 py-0.5 text-[10px] font-semibold text-brand-muted"
                      }
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            {}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[10px] border border-brand-hairline bg-white py-16 gap-3">
                <Shield className="h-8 w-8 text-brand-hairline" />
                <p className="text-sm text-brand-muted">No transactions in this status.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((txn) => (
                  <EscrowCard
                    key={txn.escrowId}
                    txn={txn}
                    role={role}
                    onClick={() => setSelected(txn)}
                  />
                ))}
              </div>
            )}
          </div>
          {}

        </>
      ) : null}
      {}
      {selected && (
        <EscrowDetailPanel
          txn={selected}
          role={role}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
