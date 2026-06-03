"use client";

import * as React from "react";
import { Workflow, WorkflowColumn as ColType, WorkflowTask } from "@/types/workflow";
import { WorkflowTaskCard } from "./WorkflowTaskCard";
import { cn } from "@/lib/utils";

interface WorkflowColumnProps {
  workflow: Workflow;
  column: ColType;
  tasks: WorkflowTask[];
  onTaskClick: (task: WorkflowTask) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => void;
  draggingId: string | null;
  actorRole?: "student" | "business";
  onAddTask?: () => void;
}

export function WorkflowColumn({
  workflow,
  column,
  tasks,
  onTaskClick,
  onDragStart,
  onDragEnd,
  onDrop,
  draggingId,
  actorRole,
  onAddTask,
}: WorkflowColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDropLocal = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    onDrop(e, column.columnId);
  };

  return (
    <div
      className={cn(
        "flex h-full w-[300px] shrink-0 flex-col rounded-[12px] transition-colors border",
        isDragOver ? "bg-brand-surface-soft border-brand-primary" : "bg-brand-surface-soft/30 border-transparent"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropLocal}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-brand-ink">{column.name}</h3>
          <span className="flex h-5 items-center justify-center rounded-full bg-brand-surface-strong px-2 text-xs font-semibold text-brand-muted">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
            className="px-2 py-0.5 rounded bg-brand-ink hover:bg-brand-primary text-white transition-all text-[11px] font-semibold"
          >
            + Add
          </button>
        )}
      </div>

      {/* Drop Zone / Task List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="flex min-h-[100px] flex-col gap-2.5 h-full">
          {tasks.map((task) => (
            <WorkflowTaskCard
              key={task.taskId}
              task={task}
              onClick={() => onTaskClick(task)}
              onDragStart={(e) => onDragStart(e, task.taskId)}
              onDragEnd={onDragEnd}
              isDragging={draggingId === task.taskId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
