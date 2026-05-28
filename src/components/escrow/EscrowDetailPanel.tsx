"use client";

import * as React from "react";
import { X, CheckCircle2, Banknote, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EscrowStatusBadge } from "./EscrowStatusBadge";
import { EscrowTimeline } from "./EscrowTimeline";
import { releaseEscrow, submitWork, requestRevision } from "@/lib/escrow-service";
import { collaborationService } from "@/lib/collaboration-service";
import type { EscrowTransaction } from "@/types/escrow";
import type { Collaboration } from "@/types/collaboration";

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
  const [collaboration, setCollaboration] = React.useState<Collaboration | null>(null);

  // Fetch collaboration for status validation
  React.useEffect(() => {
    if (txn.collaborationId) {
      collaborationService.getCollaboration(txn.collaborationId).then(setCollaboration);
    } else {
      collaborationService.getCollaborationByWorkflowId(txn.workflowId).then(setCollaboration);
    }
  }, [txn.collaborationId, txn.workflowId]);

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

  const isBusiness = role === "business";
  const collabStatus = collaboration?.status;
  const canRelease = isBusiness && (collabStatus === "in_review" || txn.status === "completed");
  const canRequestRevision = isBusiness && (collabStatus === "in_review" || txn.status === "completed");
  const canSubmit = !isBusiness && (collabStatus === "active" || collabStatus === "revision_requested" || txn.status === "funded" || txn.status === "revision_requested");

  async function handleRelease() {
    setBusy(true);
    try {
      const updated = await releaseEscrow(txn.escrowId);
      onUpdate(updated);
      showFlash("₹" + (updated.payoutAmount ?? updated.amount * 0.9).toLocaleString("en-IN") + " released to " + txn.studentName + ".");
    } catch (e: any) {
      showFlash("Error releasing escrow: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestRevision() {
    if (!note.trim()) {
      showFlash("Please describe why you're requesting a revision.");
      return;
    }
    setBusy(true);
    try {
      const updated = await requestRevision(txn.escrowId, note.trim());
      onUpdate(updated);
      setNote("");
      showFlash("Revision requested. Student notified.");
    } catch (e: any) {
      showFlash("Error requesting revision: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!note.trim()) {
      showFlash("Please describe what you delivered.");
      return;
    }
    setBusy(true);
    try {
      const updated = await submitWork(txn.escrowId, note.trim());
      onUpdate(updated);
      setNote("");
      showFlash("Work submitted! Awaiting business review.");
    } catch (e: any) {
      showFlash("Error submitting work: " + e.message);
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

          {/* Action Box */}
          {(canRelease || canSubmit) && (
            <div className="rounded-[12px] border border-brand-hairline bg-brand-surface-soft px-5 py-5 space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted">
                {canRelease ? "Review Deliverable" : "Add a note"}
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={
                  canRelease
                    ? "Provide optional feedback or revision request details…"
                    : "Describe what you've delivered (links, details)…"
                }
                className="w-full rounded-[6px] border border-brand-hairline bg-white px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted resize-none focus:outline-none focus:border-brand-info"
              />
              {canRelease && (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleRequestRevision}
                    disabled={busy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] border border-brand-coral text-brand-coral hover:bg-brand-coral/5 px-4 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    Request Revision
                  </button>
                  <button
                    onClick={handleRelease}
                    disabled={busy}
                    className="inline-flex flex-[2] items-center justify-center gap-2 rounded-[8px] bg-brand-success px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                  >
                    {busy ? <Loader2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                    Approve & Release Payment — ₹{(txn.payoutAmount ?? txn.amount * 0.9).toLocaleString("en-IN")}
                  </button>
                </div>
              )}
              {canSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors hover:bg-brand-primary-active"
                >
                  {busy ? <Loader2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  Submit Deliverable
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
