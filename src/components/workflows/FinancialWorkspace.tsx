"use client";

import * as React from "react";
import { Escrow } from "@/types/escrow";
import { Milestone } from "@/types/milestone";
import { EscrowStatusBadge } from "@/components/escrow/EscrowStatusBadge";
import { EscrowTimeline } from "@/components/escrow/EscrowTimeline";
import { 
  Wallet, 
  Landmark, 
  Banknote, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  Clock,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialWorkspaceProps {
  escrow: Escrow | null;
  milestones: Milestone[];
  isBusiness: boolean;
  isSubmitting: boolean;
  onFundEscrow: () => Promise<void>;
  onReleaseEscrow: () => Promise<void>;
  onOpenDispute: (reason: string) => Promise<void>;
}

export function FinancialWorkspace({
  escrow,
  milestones,
  isBusiness,
  isSubmitting,
  onFundEscrow,
  onReleaseEscrow,
  onOpenDispute,
}: FinancialWorkspaceProps) {
  const [disputeReason, setDisputeReason] = React.useState("");
  const [isDisputeOpen, setIsDisputeOpen] = React.useState(false);

  if (!escrow) {
    return (
      <div className="rounded-xl border border-brand-hairline bg-brand-surface-soft/10 p-5 text-center space-y-2">
        <Wallet className="w-8 h-8 text-brand-muted mx-auto opacity-20" />
        <p className="text-xs text-brand-muted font-medium">Financial ledger is not initialized yet.</p>
      </div>
    );
  }

  const handleFundLocal = async () => {
    try {
      await onFundEscrow();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReleaseLocal = async () => {
    try {
      await onReleaseEscrow();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisputeLocal = async () => {
    if (!disputeReason.trim()) {
      alert("Please provide a reason for opening this dispute.");
      return;
    }
    try {
      await onOpenDispute(disputeReason.trim());
      setDisputeReason("");
      setIsDisputeOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Actions checks
  const canFund = isBusiness && escrow.status === "pending_funding";
  const canRelease = isBusiness && escrow.status === "eligible_for_release";
  const canDispute = isBusiness && ["funded", "eligible_for_release"].includes(escrow.status);

  return (
    <div className="rounded-xl border border-brand-hairline bg-white p-5 space-y-4">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-brand-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/15">
            <Wallet className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-semibold text-brand-ink uppercase tracking-wider">Financial Ledger</h3>
        </div>
        <EscrowStatusBadge status={escrow.status} />
      </div>

      {/* Ledger Calculations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-brand-muted">Total Budget</span>
          <span className="font-semibold text-brand-ink">₹{escrow.amount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-brand-muted">Platform Service Fee (10%)</span>
          <span className="text-brand-muted">₹{(escrow.platformFee ?? escrow.amount * 0.1).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-brand-hairline pt-2.5 font-bold">
          <span className="text-brand-ink">Freelancer Net Payout</span>
          <span className="text-sm font-semibold text-brand-success">
            ₹{(escrow.payoutAmount ?? escrow.amount * 0.9).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Milestone Escrow Status Mapping */}
      <div className="border-t border-brand-hairline pt-3.5">
        <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-2.5">Milestone Release Progress</h4>
        <div className="flex flex-col gap-2">
          {milestones.map((m) => (
            <div 
              key={m.milestoneId} 
              className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-brand-surface-soft border border-brand-hairline/80 font-semibold"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  m.status === "approved" ? "bg-brand-success" : "bg-brand-surface-strong"
                )} />
                <span className="text-brand-ink truncate max-w-[170px]">{m.title}</span>
              </div>
              <span className={cn(
                "text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase shrink-0",
                m.status === "approved" ? "bg-brand-success/15 text-brand-success border-brand-success/20" : "bg-brand-surface-strong text-brand-muted border-brand-hairline"
              )}>
                {m.status === "approved" ? "Released" : "Locked"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Timeline */}
      <div className="border-t border-brand-hairline pt-3.5">
        <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-3">Escrow Timeline</h4>
        <div className="max-h-[160px] overflow-y-auto pr-1">
          <EscrowTimeline events={escrow.timeline} />
        </div>
      </div>

      {/* Operational Dispute Banner */}
      {escrow.status === "disputed" && escrow.disputeReason && (
        <div className="rounded-xl bg-brand-coral/5 border border-brand-coral/25 p-3 flex gap-2.5 items-start mt-2">
          <AlertTriangle className="h-4.5 w-4.5 text-brand-coral shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-brand-coral uppercase tracking-wider">Active Dispute</span>
            <p className="text-xs text-brand-body leading-normal">{escrow.disputeReason}</p>
          </div>
        </div>
      )}

      {/* Trust-First Action Box */}
      <div className="border-t border-brand-hairline pt-4">
        {canFund && (
          <div className="space-y-3 bg-brand-surface-soft/60 border border-brand-hairline rounded-xl p-3.5 animate-in slide-in-from-bottom-2 duration-150">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-brand-mustard uppercase tracking-wider block">Funding Required</span>
              <p className="text-xs text-brand-muted leading-relaxed">
                Initiate escrow contract funding of **₹{escrow.amount.toLocaleString("en-IN")}** to unlock project execution.
              </p>
            </div>
            <button
              onClick={handleFundLocal}
              disabled={isSubmitting}
              className="w-full py-2 bg-brand-ink hover:bg-brand-primary-active text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Landmark className="w-3.5 h-3.5" />}
              Fund Contract Escrow
            </button>
          </div>
        )}

        {canRelease && (
          <div className="space-y-3 bg-brand-success/5 border border-brand-success/20 rounded-xl p-3.5 animate-in slide-in-from-bottom-2 duration-150">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-brand-success uppercase tracking-wider block">Milestone Complete</span>
              <p className="text-xs text-brand-muted leading-relaxed">
                The milestone deliverables were fully approved. Release the contract escrow payout of **₹{(escrow.payoutAmount ?? escrow.amount * 0.9).toLocaleString("en-IN")}** to the student.
              </p>
            </div>
            <button
              onClick={handleReleaseLocal}
              disabled={isSubmitting}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />}
              Release Escrow Payout
            </button>
          </div>
        )}

        {/* Dispute initiation */}
        {canDispute && !isDisputeOpen && (
          <button
            onClick={() => setIsDisputeOpen(true)}
            className="w-full py-2 border border-brand-coral/40 text-brand-coral hover:bg-brand-coral/5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Raise Payout Dispute
          </button>
        )}

        {isDisputeOpen && (
          <div className="p-3 bg-brand-surface-soft/60 border border-brand-hairline rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-150 mt-2">
            <div className="flex justify-between items-center border-b border-brand-hairline pb-1.5">
              <span className="text-[9px] font-bold text-brand-coral uppercase tracking-wider">File Dispute Form</span>
              <button 
                onClick={() => setIsDisputeOpen(false)}
                className="text-[10px] text-brand-muted hover:text-brand-ink cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={2}
              placeholder="State clear reasons why payment should be held..."
              className="w-full rounded-md border border-brand-hairline p-2 text-xs bg-white text-brand-ink focus:outline-none focus:border-brand-primary resize-none"
            />
            
            <button
              onClick={handleDisputeLocal}
              disabled={isSubmitting || !disputeReason.trim()}
              className="w-full py-1.5 bg-brand-coral hover:bg-[#aa2d00] text-white text-xs font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              Confirm Dispute Lock
            </button>
          </div>
        )}

        {/* Read-Only Status Indicators for Students / Default States */}
        {!isBusiness && escrow.status === "pending_funding" && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl border border-brand-mustard/20 bg-[#fffbf0]/40 text-xs font-medium text-brand-mustard leading-relaxed">
            <Clock className="w-4.5 h-4.5 shrink-0" />
            <span>Awaiting funding from the business client. Tasks remain locked.</span>
          </div>
        )}

        {escrow.status === "funded" && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl border border-brand-success/15 bg-brand-success/5 text-xs font-medium text-brand-success leading-relaxed">
            <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
            <span>Escrow Funded & Verified • Execution unlocked.</span>
          </div>
        )}

        {!isBusiness && escrow.status === "eligible_for_release" && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl border border-teal-500/15 bg-teal-500/5 text-xs font-medium text-teal-700 leading-relaxed">
            <CheckCircle className="w-4.5 h-4.5 shrink-0 animate-bounce" />
            <span>Milestone approved! Awaiting client release execution.</span>
          </div>
        )}

        {escrow.status === "released" && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs font-bold text-emerald-800 leading-relaxed">
            <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
            <span>✓ Escrow Payment Released Successfully</span>
          </div>
        )}
      </div>
    </div>
  );
}
