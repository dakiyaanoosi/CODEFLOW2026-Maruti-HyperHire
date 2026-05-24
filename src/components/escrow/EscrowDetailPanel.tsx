"use client";
import * as React from "react";
import { X, CheckCircle2, Banknote, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EscrowStatusBadge } from "./EscrowStatusBadge";
import { EscrowTimeline } from "./EscrowTimeline";
import { approveEscrow, releaseEscrow, submitWork } from "@/lib/escrow-service";
import type { EscrowTransaction } from "@/types/escrow";
interface EscrowDetailPanelProps {
  txn: EscrowTransaction;
  role: "student" | "business";
  onClose: () => void;
  onUpdate: (updated: EscrowTransaction) => void;
}
export function EscrowDetailPanel({ txn, role, onClose, onUpdate }: EscrowDetailPanelProps) {
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };
  const isBusiness = role === "business";
  const canApprove  = isBusiness && txn.status === "in_review";
  const canRelease  = isBusiness && txn.status === "approved";
  const canSubmit   = !isBusiness && txn.status === "funded";
  async function handleApprove() {
    if (!note.trim()) { showFlash("Please add an approval note."); return; }
    setBusy(true);
    try {
      const updated = await approveEscrow(txn.escrowId, note.trim());
      onUpdate(updated);
      setNote("");
      showFlash("Work approved! Escrow is queued for release.");
    } finally { setBusy(false); }
  }
  async function handleRelease() {
    setBusy(true);
    try {
      const updated = await releaseEscrow(txn.escrowId);
      onUpdate(updated);
      showFlash("₹" + updated.netPayout.toLocaleString("en-IN") + " released to " + txn.studentName + ".");
    } finally { setBusy(false); }
  }
  async function handleSubmit() {
    if (!note.trim()) { showFlash("Please describe what you delivered."); return; }
    setBusy(true);
    try {
      const updated = await submitWork(txn.escrowId, note.trim());
      onUpdate(updated);
      setNote("");
      showFlash("Work submitted! Awaiting business review.");
    } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex">
      {}
      <div
        className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {}
      <div className="relative ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl overflow-y-auto">
        {}
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
          {}
          {flash && (
            <div className="rounded-[8px] bg-brand-mint/20 border border-brand-success/30 px-4 py-3 text-sm font-medium text-brand-success">
              {flash}
            </div>
          )}
          {}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCell label="Status">
              <EscrowStatusBadge status={txn.status} />
            </SummaryCell>
            <SummaryCell label="Total Amount">
              <span className="text-sm font-medium text-brand-ink">₹{txn.amount.toLocaleString("en-IN")}</span>
            </SummaryCell>
            <SummaryCell label="Platform Fee (10%)">
              <span className="text-sm text-brand-muted">₹{txn.platformFee.toLocaleString("en-IN")}</span>
            </SummaryCell>
            <SummaryCell label="Net Payout">
              <span className="text-sm font-medium text-brand-success">₹{txn.netPayout.toLocaleString("en-IN")}</span>
            </SummaryCell>
            <SummaryCell label="Business">{txn.businessName}</SummaryCell>
            <SummaryCell label="Assignee">{txn.studentName}</SummaryCell>
          </div>
          {}
          {txn.submissionNote && (
            <div className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16px] text-brand-muted mb-1.5">
                Delivery Note
              </p>
              <p className="text-sm text-brand-body leading-[1.5]">{txn.submissionNote}</p>
            </div>
          )}
          {}
          {txn.approvalNote && (
            <div className="rounded-[10px] bg-brand-mint/10 border border-brand-success/20 px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16px] text-brand-success mb-1.5">
                Approval Note
              </p>
              <p className="text-sm text-brand-body leading-[1.5]">{txn.approvalNote}</p>
            </div>
          )}
          {}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted mb-4">
              Timeline
            </p>
            <EscrowTimeline events={txn.timeline} />
          </div>
          {}
          {(canApprove || canRelease || canSubmit) && (
            <div className="rounded-[12px] border border-brand-hairline bg-brand-surface-soft px-5 py-5 space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted">
                {canRelease ? "Release Funds" : "Add a note"}
              </p>
              {!canRelease && (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder={
                    canApprove
                      ? "Describe why you're approving this work…"
                      : "Describe what you've delivered…"
                  }
                  className="w-full rounded-[6px] border border-brand-hairline bg-white px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted resize-none focus:outline-none focus:border-brand-info"
                />
              )}
              {canApprove && (
                <button
                  onClick={handleApprove}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors hover:bg-brand-primary-active"
                >
                  {busy ? <Loader2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve Work
                </button>
              )}
              {canRelease && (
                <button
                  onClick={handleRelease}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand-success px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                >
                  {busy ? <Loader2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                  Release Funds — ₹{txn.netPayout.toLocaleString("en-IN")}
                </button>
              )}
              {canSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors hover:bg-brand-primary-active"
                >
                  {busy ? <Loader2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  Submit Work for Review
                </button>
              )}
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
