"use client";

import * as React from "react";
import {
  DollarSign,
  Clock,
  GripVertical,
  AlertCircle,
  User,
  ChevronRight,
} from "lucide-react";
import { KanbanTask, PRIORITY_CONFIG, STAGE_CONFIG } from "@/types/kanban";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KanbanTaskCardProps {
  task: KanbanTask;
  onClick: (task: KanbanTask) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
}

export function KanbanTaskCard({
  task,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: KanbanTaskCardProps) {
  const daysLeft = Math.ceil(
    (new Date(task.dueDate).getTime() - Date.now()) / 86400000
  );
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 3;

  const priority = PRIORITY_CONFIG[task.priority];
  const stageColor = STAGE_CONFIG[task.stage].accentBar;

  const progressColor =
    task.progress >= 80
      ? "#006400"
      : task.progress >= 50
      ? "#254fad"
      : task.progress >= 20
      ? "#d9a441"
      : "#9297a0";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{
        opacity: isDragging ? 0.45 : 1,
        y: 0,
        scale: isDragging ? 0.97 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
    >
      {/* Native div handles drag — keeps framer-motion types clean */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        onDragEnd={onDragEnd}
        onClick={() => onClick(task)}
        className={cn(
          "group relative flex flex-col rounded-[10px] border bg-white cursor-grab active:cursor-grabbing select-none transition-shadow duration-150",
          isDragging
            ? "shadow-xl border-brand-border-strong"
            : "border-brand-hairline hover:shadow-md hover:border-brand-border-strong"
        )}
        style={{ borderTopColor: stageColor, borderTopWidth: 2 }}
      >
        {/* Drag handle + priority */}
        <div className="flex items-center justify-between px-3.5 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5 text-brand-hairline group-hover:text-brand-muted transition-colors shrink-0" />
            <span
              className={cn(
                "rounded-[4px] border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                priority.bg,
                priority.text,
                priority.border
              )}
            >
              {task.priority}
            </span>
          </div>
          {(isOverdue || isUrgent) && (
            <AlertCircle
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                isOverdue ? "text-[#aa2d00]" : "text-[#d9a441]"
              )}
            />
          )}
        </div>

        {/* Title */}
        <div className="px-3.5 pb-1.5">
          <h4 className="text-[13px] font-semibold leading-[1.35] text-brand-ink group-hover:text-brand-link transition-colors line-clamp-2">
            {task.jobTitle}
          </h4>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-brand-muted font-medium">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{task.studentName}</span>
          </div>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3.5 pb-2">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-[4px] bg-brand-surface-soft border border-brand-hairline/60 px-1.5 py-0.5 text-[9px] font-medium text-brand-muted"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="rounded-[4px] bg-brand-surface-soft border border-brand-hairline/60 px-1.5 py-0.5 text-[9px] font-medium text-brand-muted">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="px-3.5 pb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-muted">
              Progress
            </span>
            <span className="text-[10px] font-bold" style={{ color: progressColor }}>
              {task.progress}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-brand-surface-strong overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${task.progress}%`, background: progressColor }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-brand-hairline/60 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-ink">
              <DollarSign className="h-3 w-3 text-brand-muted" />
              {task.proposedBudget.toLocaleString()}
            </span>
            <span
              className={cn(
                "flex items-center gap-0.5 text-[11px] font-semibold",
                isOverdue
                  ? "text-[#aa2d00]"
                  : isUrgent
                  ? "text-[#d9a441]"
                  : "text-brand-muted"
              )}
            >
              {isOverdue ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {isOverdue
                ? `${Math.abs(daysLeft)}d overdue`
                : daysLeft === 0
                ? "Due today"
                : `${daysLeft}d left`}
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-brand-hairline group-hover:text-brand-muted transition-colors shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
