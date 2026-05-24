"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { KanbanTask, KanbanStage, STAGE_CONFIG } from "@/types/kanban";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  stage: KanbanStage;
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetStage: KanbanStage) => void;
  draggingId: string | null;
}

export function KanbanColumn({
  stage,
  tasks,
  onTaskClick,
  onDragStart,
  onDragEnd,
  onDrop,
  draggingId,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const cfg = STAGE_CONFIG[stage];

  // Average progress for column header
  const avgProgress =
    tasks.length > 0
      ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
      : 0;

  const totalValue = tasks.reduce((s, t) => s + t.quotedPrice, 0);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only fire if truly leaving the column (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    onDrop(e, stage);
  };

  const isPaid = stage === "Paid";

  return (
    <div
      className="flex flex-col rounded-[12px] border border-brand-hairline overflow-hidden"
      style={{ minWidth: 272, maxWidth: 300, flex: "0 0 272px" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div
        className={cn(
          "flex flex-col gap-2 px-4 pt-4 pb-3 border-b border-brand-hairline",
          isPaid ? "bg-[#181d26]" : "bg-white"
        )}
      >
        {/* Stage name + count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: cfg.dotColor }}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                isPaid ? "text-white" : cfg.color
              )}
            >
              {cfg.label}
            </span>
          </div>
          <span
            className={cn(
              "flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold",
              isPaid
                ? "bg-white/15 text-white"
                : "bg-brand-surface-strong text-brand-muted"
            )}
          >
            {tasks.length}
          </span>
        </div>

        {/* Column stats */}
        {tasks.length > 0 && (
          <div className={cn("flex items-center justify-between text-[10px] font-medium", isPaid ? "text-white/60" : "text-brand-muted")}>
            <span>
              ${totalValue.toLocaleString()} total
            </span>
            <span>{avgProgress}% avg progress</span>
          </div>
        )}

        {/* Mini progress bar for column */}
        {tasks.length > 0 && (
          <div className={cn("h-1 w-full rounded-full overflow-hidden", isPaid ? "bg-white/15" : "bg-brand-surface-strong")}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${avgProgress}%`,
                background: cfg.accentBar,
              }}
            />
          </div>
        )}
      </div>

      {/* Cards area */}
      <div
        className={cn(
          "flex flex-col gap-2.5 flex-1 p-2.5 transition-colors duration-150 overflow-y-auto",
          isDragOver
            ? "bg-brand-surface-soft ring-2 ring-inset ring-brand-info/30"
            : cfg.bg
        )}
        style={{ minHeight: 120 }}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingId === task.id}
            />
          ))}
        </AnimatePresence>

        {/* Drop zone indicator */}
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-[8px] border-2 border-dashed border-brand-info/40 bg-brand-info/5 py-6 flex items-center justify-center"
          >
            <span className="text-[11px] font-semibold text-brand-info">
              Drop here → {cfg.label}
            </span>
          </motion.div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && !isDragOver && (
          <div className="flex items-center justify-center py-8">
            <span className="text-[11px] font-medium text-brand-muted">
              No tasks
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
