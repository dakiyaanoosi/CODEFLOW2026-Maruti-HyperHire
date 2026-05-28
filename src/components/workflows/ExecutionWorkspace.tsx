"use client";

import * as React from "react";
import { Workflow, WorkflowTask } from "@/types/workflow";
import { Milestone } from "@/types/milestone";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Play, 
  Send, 
  Plus, 
  Sparkles,
  Paperclip,
  Calendar,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ExecutionWorkspaceProps {
  workflow: Workflow;
  activeMilestone: Milestone | null;
  tasks: WorkflowTask[];
  actorRole: "student" | "business";
  collaborationStatus: string;
  onAddTaskClick: (type: WorkflowTask["taskType"]) => void;
  onTaskClick: (task: WorkflowTask) => void;
  onStartTask: (taskId: string) => void;
  onSubmitWorkClick: (task: WorkflowTask) => void;
}

export function ExecutionWorkspace({
  workflow,
  activeMilestone,
  tasks,
  actorRole,
  collaborationStatus,
  onAddTaskClick,
  onTaskClick,
  onStartTask,
  onSubmitWorkClick,
}: ExecutionWorkspaceProps) {
  if (!activeMilestone) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-brand-hairline rounded-xl bg-brand-surface-soft/10">
        <Layers className="h-10 w-10 text-brand-muted mb-3 opacity-30" />
        <h4 className="text-sm font-semibold text-brand-ink">No Active Milestone Selected</h4>
        <p className="text-xs text-brand-muted mt-1">Please select a milestone from the navigation sidebar to begin execution tracking.</p>
      </div>
    );
  }

  const isStudent = actorRole === "student";

  // Priority badge styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "High": return "bg-brand-coral/10 text-brand-coral border-brand-coral/20";
      case "Medium": return "bg-brand-mustard/15 text-[#8a6200] border-brand-mustard/20";
      default: return "bg-brand-surface-strong text-brand-muted border-brand-hairline/80";
    }
  };

  // Status badge styling
  const getStatusLabelAndStyle = (status: string) => {
    switch (status) {
      case "approved": return { label: "✓ Approved", className: "bg-brand-success/15 text-brand-success border-brand-success/20" };
      case "submitted": return { label: "Awaiting Review", className: "bg-brand-info/10 text-brand-info border-brand-info/20" };
      case "revision_requested": return { label: "Revision Required", className: "bg-brand-coral/10 text-brand-coral border-brand-coral/20" };
      case "in_progress": return { label: "In Progress", className: "bg-brand-primary/10 text-brand-ink border-brand-hairline" };
      default: return { label: "Todo / Pending", className: "bg-brand-surface-soft text-brand-muted border-brand-hairline" };
    }
  };

  return (
    <div className="space-y-5 w-full">
      {/* Active Milestone Card */}
      <div className="p-5 rounded-xl border border-brand-hairline bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-hairline pb-3.5">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-brand-muted">Active Execution Phase</span>
            <h3 className="text-base font-semibold text-brand-ink tracking-tight flex items-center gap-2">
              Milestone {activeMilestone.order + 1}: {activeMilestone.title}
              {activeMilestone.eligibleForRelease && (
                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Release Ready
                </span>
              )}
            </h3>
            {activeMilestone.description && (
              <p className="text-xs text-brand-muted mt-1 leading-relaxed max-w-2xl">{activeMilestone.description}</p>
            )}
          </div>

          <div className="flex flex-col shrink-0 text-right sm:items-end space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-brand-muted">Phase Progress</span>
            <span className="text-sm font-semibold text-brand-ink">{activeMilestone.progress}% Complete</span>
            <div className="w-28 h-1 bg-brand-surface-soft rounded-full overflow-hidden border border-brand-hairline/80">
              <div 
                className="h-full bg-brand-success transition-all duration-300"
                style={{ width: `${activeMilestone.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Milestone operational details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium pt-0.5">
          <div className="space-y-1 bg-brand-surface-soft/60 border border-brand-hairline/60 rounded-lg p-2.5">
            <span className="text-brand-muted block text-[9px] uppercase tracking-wider">Review State</span>
            <span className={cn(
              "inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md",
              activeMilestone.status === "approved" ? "bg-brand-success/15 text-brand-success" :
              activeMilestone.status === "in_review" ? "bg-brand-info/10 text-brand-info" :
              activeMilestone.status === "revision_requested" ? "bg-brand-coral/10 text-brand-coral" :
              activeMilestone.status === "active" ? "bg-brand-primary/10 text-brand-primary" :
              "bg-brand-surface-strong text-brand-muted"
            )}>
              {activeMilestone.status.replace("_", " ")}
            </span>
          </div>

          <div className="space-y-1 bg-brand-surface-soft/60 border border-brand-hairline/60 rounded-lg p-2.5">
            <span className="text-brand-muted block text-[9px] uppercase tracking-wider">Due Date</span>
            <span className="text-brand-ink flex items-center gap-1 text-[11px] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-brand-muted" />
              {activeMilestone.dueDate 
                ? new Date(activeMilestone.dueDate as string).toLocaleDateString(undefined, { dateStyle: "medium" }) 
                : "No date specified"}
            </span>
          </div>

          <div className="space-y-1 bg-brand-surface-soft/60 border border-brand-hairline/60 rounded-lg p-2.5">
            <span className="text-brand-muted block text-[9px] uppercase tracking-wider">Budget Allocation</span>
            <span className="text-brand-success text-[11px] font-bold">
              ₹{((workflow as any).agreedBudget 
                ? (workflow as any).agreedBudget / 2 
                : 15000).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Task Execution Checklist Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 items-center justify-center rounded-full bg-brand-surface-strong px-2 text-xs font-semibold text-brand-ink">
              {tasks.length}
            </span>
            <h4 className="text-xs font-semibold text-brand-ink uppercase tracking-wider">Milestone Execution Tasks</h4>
          </div>
          {isStudent && activeMilestone.status !== "approved" && ["active", "revision_requested"].includes(collaborationStatus) && (
            <button
              onClick={() => onAddTaskClick("execution")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-hairline bg-white hover:bg-brand-surface-soft text-xs font-semibold text-brand-ink rounded-[8px] transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Execution Task
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-brand-hairline text-center bg-white space-y-2">
            <p className="text-xs text-brand-muted font-medium">No tasks are currently defined for this milestone phase.</p>
            {isStudent && (
              <button
                onClick={() => onAddTaskClick("execution")}
                className="mt-2 text-xs font-bold text-brand-link hover:text-brand-link-active"
              >
                + Define a new task
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => {
              const statusCfg = getStatusLabelAndStyle(task.status);
              const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== "approved" : false;

              return (
                <div
                  key={task.taskId}
                  onClick={() => onTaskClick(task)}
                  className={cn(
                    "flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-brand-hairline rounded-xl shadow-sm hover:border-brand-primary/50 transition-all gap-4 group cursor-pointer",
                    task.status === "approved" && "bg-brand-surface-soft/20 opacity-85",
                    task.status === "revision_requested" && "border-brand-warning/35 bg-[#fffbf0]/40"
                  )}
                >
                  <div className="flex items-start gap-3.5 max-w-xl">
                    {/* Status circle indicator */}
                    <div className="mt-1 shrink-0">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all",
                        task.status === "approved" ? "border-brand-success text-brand-success bg-brand-success/5" :
                        task.status === "submitted" ? "border-brand-info text-brand-info animate-pulse" :
                        task.status === "revision_requested" ? "border-brand-coral text-brand-coral" :
                        task.status === "in_progress" ? "border-brand-primary text-brand-primary" :
                        "border-brand-hairline"
                      )}>
                        {task.status === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {task.status === "in_progress" && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs font-semibold text-brand-ink leading-tight tracking-tight group-hover:text-brand-link transition-colors">
                          {task.title}
                        </span>
                        
                        {/* Task Type Tag */}
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-brand-hairline bg-brand-surface-soft text-brand-muted">
                          {task.taskType}
                        </span>

                        <span className={cn(
                          "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                          getPriorityStyle(task.priority)
                        )}>
                          {task.priority} Priority
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">{task.description}</p>
                      )}

                      {/* Attachments & Suggestions indicator */}
                      <div className="flex items-center gap-3 pt-1 text-[10px] font-semibold text-brand-muted">
                        {task.attachments && task.attachments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            {task.attachments.length} files
                          </span>
                        )}
                        {task.aiSuggestions && task.aiSuggestions.length > 0 && (
                          <span className="flex items-center gap-1 text-brand-secondary font-bold">
                            <Sparkles className="w-3 h-3" />
                            HyperAI suggestions
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={cn(
                            "flex items-center gap-1",
                            isOverdue ? "text-[#aa2d00]" : ""
                          )}>
                            <Clock className="w-3 h-3" />
                            {isOverdue 
                              ? `Overdue (${formatDistanceToNow(new Date(task.dueDate))} ago)` 
                              : `Due in ${formatDistanceToNow(new Date(task.dueDate))}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Status badges on right */}
                  <div className="shrink-0 flex items-center gap-3 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                    {/* Render action button based on student role & state */}
                    {isStudent && activeMilestone.status !== "approved" && (
                      <>
                        {task.status === "pending" && (
                          <button
                            onClick={() => onStartTask(task.taskId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-ink hover:bg-brand-primary-active text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Start Work
                          </button>
                        )}
                        {(task.status === "in_progress" || task.status === "revision_requested") && (
                          <button
                            onClick={() => onSubmitWorkClick(task)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-ink hover:bg-brand-primary-active text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all"
                          >
                            <Send className="w-3 h-3" />
                            Submit Deliverable
                          </button>
                        )}
                      </>
                    )}

                    {/* Static status display banner */}
                    {(!isStudent || task.status === "submitted" || task.status === "approved") && (
                      <span className={cn(
                        "px-2.5 py-1 rounded-[6px] text-xs font-semibold border",
                        statusCfg.className
                      )}>
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
