"use client";

import * as React from "react";
import { X, Banknote, Loader2, AlertTriangle, Landmark } from "lucide-react";
import { EscrowStatusBadge } from "./EscrowStatusBadge";
import { EscrowTimeline } from "./EscrowTimeline";
import { releaseEscrow, fundEscrow } from "@/lib/escrow-service";
import type { EscrowTransaction } from "@/types/escrow";
import { useAuthStore } from "@/store/use-auth-store";
import { canFundEscrow, canReleaseEscrow } from "@/lib/collaboration/permission-policy";

interface EscrowDetailPanelProps {
  txn: EscrowTransaction;
  role: "student" | "business";
  onClose: () => void;
  onUpdate: (updated: EscrowTransaction) => void;
}

export function EscrowDetailPanel({ txn, role, onClose, onUpdate }: EscrowDetailPanelProps) {
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

  const { user } = useAuthStore();
  const canFund = canFundEscrow(role, txn.status);
  const canRelease = canReleaseEscrow(role, txn.status);

  async function handleFund() {
    if (!user) return;
    setBusy(true);
    try {
      const updated = await fundEscrow(txn.escrowId, user.uid, role);
      onUpdate(updated);
      showFlash("Escrow funded successfully! Execution is now unlocked.");
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      showFlash("Error funding escrow: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRelease() {
    if (!user) return;
    setBusy(true);
    try {
      const updated = await releaseEscrow(txn.escrowId, user.uid, role);
      onUpdate(updated);
      showFlash("₹" + (updated.payoutAmount ?? updated.amount * 0.9).toLocaleString("en-IN") + " released to " + txn.studentName + ".");
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      showFlash("Error releasing escrow: " + err.message);
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-brand-hairline px-6 py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16px] text-brand-muted mb-1">
              Escrow #{txn.escrowId}
            </p>
            <h2 className="text-lg font-medium text-brand-ink leading-[1.4] truncate">
              {txn.jobTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center rounded-[8px] h-8 w-8 border border-brand-hairline text-brand-muted hover:text-brand-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 px-6 py-6 space-y-6">
          {flash && (
            <div className="rounded-[8px] bg-brand-mint/20 border border-brand-success/30 px-4 py-3 text-sm font-medium text-brand-success animate-in fade-in-50 duration-200">
              {flash}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCell label="Status">
              <EscrowStatusBadge status={txn.status} />
            </SummaryCell>
            <SummaryCell label="Total Budget">
              <span className="text-sm font-medium text-brand-ink">₹{txn.amount.toLocaleString("en-IN")}</span>
            </SummaryCell>
            <SummaryCell label="Platform Fee (10%)">
              <span className="text-sm text-brand-muted">₹{(txn.platformFee ?? txn.amount * 0.1).toLocaleString("en-IN")}</span>
            </SummaryCell>
            <SummaryCell label="Net Payout">
              <span className="text-sm font-medium text-brand-success">₹{(txn.payoutAmount ?? txn.amount * 0.9).toLocaleString("en-IN")}</span>
            </SummaryCell>
            <SummaryCell label="Business">{txn.businessName}</SummaryCell>
            <SummaryCell label="Assignee">{txn.studentName}</SummaryCell>
          </div>

          {/* Notes section */}
          {txn.submissionNote && (
            <div className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16px] text-brand-muted mb-1.5">
                Delivery Note
              </p>
              <p className="text-sm text-brand-body leading-[1.5]">{txn.submissionNote}</p>
            </div>
          )}

          {txn.revisionNote && (
            <div className="rounded-[10px] bg-brand-coral/10 border border-brand-coral/20 px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16px] text-brand-coral mb-1.5">
                Revision Request Note
              </p>
              <p className="text-sm text-brand-body leading-[1.5]">{txn.revisionNote}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted mb-4">
              Timeline
            </p>
            <EscrowTimeline events={txn.timeline} />
          </div>

          {/* Active Dispute Banner */}
          {txn.status === "disputed" && txn.disputeReason && (
            <div className="rounded-[10px] bg-brand-coral/10 border border-brand-coral/25 px-4 py-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-brand-coral shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-brand-coral uppercase tracking-[0.16px] mb-1">
                  Active Contract Dispute
                </p>
                <p className="text-sm text-brand-body leading-[1.4]">{txn.disputeReason}</p>
              </div>
            </div>
          )}

          {/* Action Box */}
          {canFund && (
            <div className="rounded-[12px] border border-brand-hairline bg-brand-surface-soft px-5 py-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-brand-ink uppercase tracking-[0.16px] mb-1">
                  Escrow Funding Pending
                </h3>
                <p className="text-xs text-brand-muted leading-[1.35]">
                  This contract requires funding to unlock execution. The student will not be able to start task execution or submit deliverables until funding is initiated.
                </p>
              </div>
              <button
                onClick={handleFund}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors hover:bg-brand-primary-active"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
                Fund Contract Escrow — ₹{txn.amount.toLocaleString("en-IN")}
              </button>
            </div>
          )}

          {canRelease && (
            <div className="rounded-[12px] border border-brand-hairline bg-brand-surface-soft px-5 py-5">
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-brand-ink uppercase tracking-[0.16px] mb-1">
                    Release Payment
                  </h3>
                  <p className="text-xs text-brand-muted leading-[1.35]">
                    The milestone has been approved. You can now release the escrowed funds to the student.
                  </p>
                </div>
                <button
                  onClick={handleRelease}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors hover:bg-emerald-700"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                  Approve & Release Payment — ₹{(txn.payoutAmount ?? txn.amount * 0.9).toLocaleString("en-IN")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border border-brand-hairline bg-white px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16px] text-brand-muted mb-1">{label}</p>
      <div className="text-sm text-brand-body">{children}</div>
    </div>
  );
}
