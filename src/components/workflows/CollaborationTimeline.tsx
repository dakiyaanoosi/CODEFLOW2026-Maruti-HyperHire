"use client";

import * as React from "react";
import { WorkflowActivity } from "@/types/workflow";
import { formatDistanceToNow } from "date-fns";
import { 
  Activity, 
  PlusCircle, 
  MoveRight, 
  CheckCircle2, 
  Paperclip, 
  MessageSquare, 
  Flag,
  DollarSign,
  AlertTriangle,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CollaborationTimelineProps {
  activities: WorkflowActivity[];
}

export function CollaborationTimeline({ activities }: CollaborationTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-[200px] flex-col p-6 items-center justify-center text-center text-brand-muted border border-brand-hairline rounded-xl bg-white">
        <History className="h-8 w-8 mb-2 opacity-20 text-brand-muted" />
        <p className="text-xs font-semibold text-brand-ink">Timeline is empty</p>
        <p className="text-[10px] mt-0.5">Activities and milestones will appear here in real-time.</p>
      </div>
    );
  }

  // Helper to map event type to an icon and colors
  const getEventStyle = (type: string, message: string) => {
    const isPayment = message.toLowerCase().includes("pay") || message.toLowerCase().includes("escrow");
    const isMilestone = message.toLowerCase().includes("milestone");
    const isDispute = message.toLowerCase().includes("dispute");

    if (isDispute) {
      return {
        icon: AlertTriangle,
        iconClass: "text-brand-coral bg-brand-coral/10 border-brand-coral/20",
        dotClass: "bg-brand-coral"
      };
    }

    if (isPayment) {
      return {
        icon: DollarSign,
        iconClass: "text-brand-success bg-brand-success/15 border-brand-success/20",
        dotClass: "bg-brand-success"
      };
    }

    if (isMilestone) {
      return {
        icon: Flag,
        iconClass: "text-brand-info bg-brand-info/10 border-brand-info/20",
        dotClass: "bg-brand-info"
      };
    }

    switch (type) {
      case "task_created":
        return {
          icon: PlusCircle,
          iconClass: "text-brand-muted bg-brand-surface-soft border-brand-hairline",
          dotClass: "bg-brand-surface-strong"
        };
      case "task_completed":
        return {
          icon: CheckCircle2,
          iconClass: "text-brand-success bg-brand-success/15 border-brand-success/20",
          dotClass: "bg-brand-success"
        };
      case "attachment_uploaded":
        return {
          icon: Paperclip,
          iconClass: "text-brand-primary bg-brand-primary/10 border-brand-primary/20",
          dotClass: "bg-brand-primary"
        };
      case "message_sent":
        return {
          icon: MessageSquare,
          iconClass: "text-brand-primary bg-brand-primary/10 border-brand-primary/20",
          dotClass: "bg-brand-primary"
        };
      default:
        return {
          icon: Activity,
          iconClass: "text-brand-muted bg-brand-surface-soft border-brand-hairline",
          dotClass: "bg-brand-surface-strong"
        };
    }
  };

  return (
    <div className="rounded-xl border border-brand-hairline bg-white p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-brand-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-ink" />
          <h3 className="text-xs font-semibold text-brand-ink uppercase tracking-wider">Workspace Activity Feed</h3>
        </div>
      </div>

      <div className="flex flex-col gap-5 relative pr-1 pl-1">
        {/* Connected vertical line */}
        <div className="absolute left-[13px] top-3 bottom-3 w-px bg-brand-hairline/80" />

        <div className="flex flex-col gap-5 max-h-[300px] overflow-y-auto pr-1">
          {activities.map((act) => {
            const style = getEventStyle(act.type, act.message);
            const Icon = style.icon;
            
            const isClient = act.actorId === act.businessId;
            const isFreelancer = act.actorId === act.studentId;
            const roleLabel = isClient ? "Client" : isFreelancer ? "Freelancer" : "System";
            const roleColorClass = isClient 
              ? "bg-brand-primary/10 text-brand-ink border-brand-hairline" 
              : isFreelancer 
              ? "bg-brand-success/15 text-brand-success border-brand-success/20" 
              : "bg-brand-surface-strong text-brand-muted border-brand-hairline";

            const eventDate = act.createdAt ? new Date(act.createdAt) : null;

            return (
              <div key={act.activityId} className="relative pl-9 flex gap-3 text-xs leading-normal">
                {/* Timeline dot icon */}
                <div className={cn(
                  "absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white border shadow-sm transition-all shrink-0",
                  style.iconClass
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="space-y-0.5 flex-1">
                  <p className="text-brand-ink leading-relaxed font-medium">
                    <span className="font-semibold text-brand-ink">{act.actorName}</span>{" "}
                    <span className={cn("px-1.5 py-0.5 rounded-[5px] text-[8px] font-bold uppercase tracking-wider border", roleColorClass)}>
                      {roleLabel}
                    </span>{" "}
                    <span className="text-brand-muted font-normal">{act.message}</span>
                  </p>
                  
                  {eventDate && (
                    <p className="text-[9px] text-brand-muted font-mono">
                      {formatDistanceToNow(eventDate)} ago
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
