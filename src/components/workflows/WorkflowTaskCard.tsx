"use client";

import * as React from "react";
import { WorkflowTask } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { Paperclip, Sparkles, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WorkflowTaskCardProps {
  task: WorkflowTask;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function WorkflowTaskCard({
  task,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
}: WorkflowTaskCardProps) {
  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== "approved" : false;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "group relative flex cursor-grab flex-col gap-3 rounded-[10px] border border-brand-hairline bg-white p-3.5 shadow-sm transition-all hover:border-brand-primary hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-brand-primary/20",
        task.status === "approved" && "opacity-80",
        task.status === "revision_requested" && "border-brand-warning/40 bg-[#fffbf0]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-tight text-brand-ink">
          {task.title}
        </h4>
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-brand-muted">
        {task.description}
      </p>

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-brand-hairline pt-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
              task.priority === "High" ? "bg-[#aa2d00]/10 text-[#aa2d00]" :
              task.priority === "Medium" ? "bg-[#d9a441]/10 text-[#8a6200]" :
              "bg-brand-surface-strong text-brand-muted"
            )}
          >
            {task.priority}
          </span>
          {task.attachments?.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-brand-muted">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}
          {task.aiSuggestions?.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-brand-secondary">
              <Sparkles className="h-3 w-3" />
            </div>
          )}
        </div>
        
        {task.dueDate && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-medium",
            isOverdue ? "text-[#aa2d00]" : "text-brand-muted"
          )}>
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(task.dueDate))} {isOverdue ? "overdue" : "left"}
          </div>
        )}
      </div>
    </div>
  );
}
