"use client";

import * as React from "react";
import { Collaboration, CollaborationStatus } from "@/types/collaboration";
import { Milestone } from "@/types/milestone";
import { Escrow } from "@/types/escrow";
import { 
  User, 
  ArrowRight, 
  Wallet, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  Clock,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// Status styles derived from Globals.css
const STATUS_CONFIG: Record<CollaborationStatus, { label: string; color: string; bgColor: string }> = {
  setup_pending: { label: "Setup Pending", color: "text-brand-ink", bgColor: "bg-brand-surface-strong" },
  scope_review: { label: "Scope Review", color: "text-brand-info", bgColor: "bg-brand-info/10" },
  awaiting_funding: { label: "Awaiting Funding", color: "text-brand-mustard bg-brand-mustard/15", bgColor: "bg-brand-mustard/10" },
  active: { label: "Active Phase", color: "text-brand-primary bg-brand-primary/10", bgColor: "bg-brand-primary/10" },
  in_review: { label: "In Review", color: "text-brand-info bg-brand-info/15", bgColor: "bg-brand-info/10" },
  revision_requested: { label: "Revision Requested", color: "text-brand-coral bg-brand-coral/10", bgColor: "bg-brand-coral/10" },
  completed: { label: "Completed", color: "text-brand-success bg-brand-success/10", bgColor: "bg-brand-success/10" },
  cancelled: { label: "Cancelled", color: "text-brand-coral bg-brand-coral/10", bgColor: "bg-brand-coral/10" },
  disputed: { label: "Disputed", color: "text-brand-coral bg-brand-coral/10", bgColor: "bg-brand-coral/10" },
};

interface CollaborationOverviewHeaderProps {
  collaboration: Collaboration | null;
  activeMilestone: Milestone | null;
  escrow: Escrow | null;
  progressPercent: number;
  isBusiness: boolean;
  hasSubmittedReview: boolean;
  onLeaveReviewTrigger: () => void;
  onFundEscrowTrigger: () => void;
  onReleaseEscrowTrigger: () => void;
}

export function CollaborationOverviewHeader({
  collaboration,
  activeMilestone,
  escrow,
  progressPercent,
  isBusiness,
  hasSubmittedReview,
  onLeaveReviewTrigger,
  onFundEscrowTrigger,
  onReleaseEscrowTrigger,
}: CollaborationOverviewHeaderProps) {
  if (!collaboration) return null;

  const collabStatus = collaboration.status || "active";
  const statusCfg = STATUS_CONFIG[collabStatus] || STATUS_CONFIG.active;

  // Next-Action Intelligence resolver
  const getNextAction = () => {
    if (!escrow) {
      return {
        title: "Initializing Contract Setup",
        description: "The financial escrow contract is provisioning. Execution is temporarily locked.",
        type: "info",
        action: null,
      };
    }

    if (escrow.status === "pending_funding") {
      return {
        title: isBusiness ? "Action Required: Fund Escrow" : "Awaiting Client Funding",
        description: isBusiness 
          ? "You must fund the contract escrow to unlock execution and allow the student to start tasks."
          : `Awaiting ${collaboration.businessName} to fund the escrow contract. Execution remains locked.`,
        type: "warning",
        action: isBusiness ? (
          <button
            onClick={onFundEscrowTrigger}
            className="px-3.5 py-1.5 bg-brand-ink text-white rounded-lg text-xs font-medium hover:bg-brand-primary-active transition-all cursor-pointer shadow-sm"
          >
            Fund Escrow Now
          </button>
        ) : null,
      };
    }

    if (escrow.status === "disputed") {
      return {
        title: "Collaboration Paused: Escrow Under Dispute",
        description: "A formal dispute has been opened for this contract. Escrow funds are locked pending arbitration.",
        type: "danger",
        action: null,
      };
    }

    if (activeMilestone) {
      if (activeMilestone.status === "in_review") {
        return {
          title: isBusiness ? "Action Required: Evaluate Deliverables" : "Milestone Under Review",
          description: isBusiness
            ? `Please review the deliverables submitted by ${collaboration.studentName} for approval.`
            : `Your submitted deliverables for ${activeMilestone.title} are being reviewed by ${collaboration.businessName}.`,
          type: "info",
          action: isBusiness ? (
            <span className="text-xs text-brand-muted italic font-medium">Review workspace active below</span>
          ) : null,
        };
      }

      if (activeMilestone.status === "revision_requested") {
        return {
          title: isBusiness ? "Awaiting Revision Submission" : "Action Required: Address Revision Request",
          description: isBusiness
            ? `Waiting for ${collaboration.studentName} to submit revisions addressing your feedback.`
            : `Your submission was returned for changes. Review client feedback and submit revisions.`,
          type: "warning",
          action: null,
        };
      }

      if (activeMilestone.status === "approved") {
        if (escrow.status === "eligible_for_release" || escrow.status === "funded") {
          return {
            title: isBusiness ? "Action Required: Release Escrow Payout" : "Awaiting Payout Release",
            description: isBusiness
              ? "All milestone requirements have been approved. Release the escrow payout to the student."
              : `Milestone approved! Awaiting ${collaboration.businessName} to release your payout.`,
            type: "success",
            action: isBusiness ? (
              <button
                onClick={onReleaseEscrowTrigger}
                className="px-3.5 py-1.5 bg-brand-success text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
              >
                Release Payout
              </button>
            ) : null,
          };
        }
      }
    }

    // Default active execution state
    if (collabStatus === "active") {
      return {
        title: isBusiness ? "Oversight Phase Active" : "Action Required: Active Task Execution",
        description: isBusiness
          ? `${collaboration.studentName} is currently executing tasks assigned to ${activeMilestone?.title || "Milestone 1"}.`
          : "Work on execution tasks in the workspace, upload files, and submit deliverables when ready.",
        type: "active",
        action: null,
      };
    }

    if (collabStatus === "completed") {
      if (!hasSubmittedReview) {
        return {
          title: "Action Required: Leave Collaboration Review",
          description: "This contract is fully completed and paid. Share your feedback to build network trust.",
          type: "success",
          action: (
            <button
              onClick={onLeaveReviewTrigger}
              className="px-3.5 py-1.5 bg-brand-ink text-white rounded-lg text-xs font-medium hover:bg-brand-primary-active transition-all cursor-pointer shadow-sm"
            >
              Submit Review
            </button>
          ),
        };
      } else {
        return {
          title: "Contract Successfully Concluded",
          description: "All payments released and reviews completed. Thank you for a successful collaboration!",
          type: "success",
          action: null,
        };
      }
    }

    return {
      title: "Active Partnership Workspace",
      description: "Collaborating phase active. Keep aligned on delivery milestones.",
      type: "info",
      action: null,
    };
  };

  const nextAction = getNextAction();

  // Milestone delivery health indicator
  const getDeliveryHealth = () => {
    if (!activeMilestone || activeMilestone.status === "approved") {
      return { label: "Milestone Completed", color: "text-brand-success bg-brand-success/10 border-brand-success/20" };
    }
    if (!activeMilestone.dueDate) {
      return { label: "No Due Date Set", color: "text-brand-muted bg-brand-surface-soft border-brand-hairline" };
    }
    
    const dueDate = new Date(activeMilestone.dueDate as string);
    const isOverdue = dueDate < new Date();
    
    if (isOverdue) {
      return { label: "Delivery Delayed / Overdue", color: "text-brand-coral bg-brand-coral/5 border-brand-coral/25 animate-pulse" };
    }
    
    return { label: `Target: ${dueDate.toLocaleDateString()}`, color: "text-brand-info bg-brand-info/5 border-brand-info/20" };
  };

  const health = getDeliveryHealth();

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Collaboration Core Meta Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-brand-hairline pb-4 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center flex-wrap gap-2.5">
              <h1 className="text-xl font-semibold text-brand-ink tracking-tight">
                {collaboration.title}
              </h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-[6px] text-[10px] font-semibold tracking-wide uppercase border",
                statusCfg.color
              )}>
                {statusCfg.label}
              </span>
            </div>
            
            {/* Participants flat profile badge style */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-brand-muted mt-1 font-medium">
              <span className="flex items-center gap-1.5 bg-brand-surface-soft border border-brand-hairline px-2.5 py-1 rounded-[6px] text-brand-ink">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-info shrink-0" />
                <span className="text-[10px] uppercase font-bold text-brand-muted tracking-[0.2px] mr-1">Client:</span>
                {collaboration.businessName}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-hairline" />
              <span className="flex items-center gap-1.5 bg-brand-surface-soft border border-brand-hairline px-2.5 py-1 rounded-[6px] text-brand-ink">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-success shrink-0" />
                <span className="text-[10px] uppercase font-bold text-brand-muted tracking-[0.2px] mr-1">Freelancer:</span>
                {collaboration.studentName}
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Snapshot */}
        <div className="flex items-center gap-4.5 flex-wrap self-start lg:self-center">
          <div className="flex flex-col text-right">
            <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Overall Project Progress</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 md:w-32 h-1.5 bg-brand-surface-soft rounded-full overflow-hidden border border-brand-hairline/80">
                <div 
                  className="h-full bg-brand-ink transition-all duration-500 rounded-full" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              <span className="text-xs font-semibold text-brand-ink">{progressPercent}%</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider mb-1">Phase Health</span>
            <span className={cn(
              "px-2.5 py-1 rounded-[6px] text-xs font-medium border",
              health.color
            )}>
              {health.label}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Next-Action Intelligence Banner */}
      <div className={cn(
        "rounded-[10px] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border transition-all shadow-sm animate-in fade-in duration-300",
        nextAction.type === "warning" ? "bg-[#fffbf0] border-brand-mustard/35 text-brand-ink" :
        nextAction.type === "danger" ? "bg-brand-coral/5 border-brand-coral/25 text-brand-ink" :
        nextAction.type === "success" ? "bg-brand-success/5 border-emerald-800/25 text-brand-ink" :
        "bg-brand-surface-soft border-brand-hairline text-brand-ink"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg shrink-0 mt-0.5 border",
            nextAction.type === "warning" ? "bg-brand-mustard/10 border-brand-mustard/20 text-brand-mustard" :
            nextAction.type === "danger" ? "bg-brand-coral/10 border-brand-coral/20 text-brand-coral" :
            nextAction.type === "success" ? "bg-brand-success/15 border-brand-success/20 text-brand-success" :
            "bg-brand-surface-strong border-brand-hairline text-brand-muted"
          )}>
            {nextAction.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : nextAction.type === "danger" ? (
              <ShieldAlert className="w-4 h-4" />
            ) : nextAction.type === "warning" ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-brand-ink flex items-center gap-1.5">
              {nextAction.title}
              {nextAction.type === "success" && (
                <Sparkles className="w-3.5 h-3.5 text-brand-mustard animate-bounce" />
              )}
            </h4>
            <p className="text-xs text-brand-muted mt-0.5 leading-normal">
              {nextAction.description}
            </p>
          </div>
        </div>
        {nextAction.action && (
          <div className="shrink-0 self-end md:self-center">
            {nextAction.action}
          </div>
        )}
      </div>
    </div>
  );
}
