"use client";

import * as React from "react";
import { WorkflowActivity } from "@/types/workflow";
import { formatDistanceToNow } from "date-fns";
import { Activity, PlusCircle, MoveRight, CheckCircle2, Paperclip, MessageSquare, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowActivityFeedProps {
  activities: WorkflowActivity[];
}

export function WorkflowActivityFeed({ activities }: WorkflowActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-full flex-col p-6 items-center justify-center text-center text-brand-muted">
        <Activity className="h-8 w-8 mb-3 opacity-20" />
        <p className="text-sm font-medium">No activity yet</p>
        <p className="text-xs mt-1">Actions taken in this workspace will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col pt-4 pb-8">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-4 h-4 text-brand-ink" />
        <h3 className="text-sm font-semibold text-brand-ink">Activity Feed</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-2 relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-brand-hairline" />
        
        {activities.map((act) => {
          const Icon = getIcon(act.type);
          return (
            <div key={act.activityId} className="relative pl-8">
              <div className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-brand-hairline shadow-sm">
                <Icon className="w-3 h-3 text-brand-ink" />
              </div>
              <p className="text-sm text-brand-ink leading-snug">
                <span className="font-semibold">{act.actorName}</span> {act.message}
              </p>
              <p className="text-[10px] text-brand-muted mt-0.5">
                {formatDistanceToNow(new Date(act.createdAt))} ago
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getIcon(type: string) {
  switch (type) {
    case "task_created": return PlusCircle;
    case "task_moved": return MoveRight;
    case "task_completed": return CheckCircle2;
    case "attachment_uploaded": return Paperclip;
    case "message_sent": return MessageSquare;
    case "milestone_completed": return Flag;
    case "workflow_created": return Activity;
    default: return Activity;
  }
}
