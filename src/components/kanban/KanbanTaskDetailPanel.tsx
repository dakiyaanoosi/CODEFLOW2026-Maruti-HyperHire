"use client";

import * as React from "react";
import {
  X,
  DollarSign,
  Clock,
  Calendar,
  User,
  Building2,
  Sparkles,
  ChevronDown,
  Send,
  BarChart2,
  Activity,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  KanbanTask,
  KanbanStage,
  KANBAN_STAGES,
  STAGE_CONFIG,
  PRIORITY_CONFIG,
} from "@/types/kanban";
import { kanbanService } from "@/lib/kanban-service";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface KanbanTaskDetailPanelProps {
  task: KanbanTask | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (task: KanbanTask) => void;
  actorName: string;
  canEdit?: boolean;
}

function ActivityItem({
  actor,
  message,
  timestamp,
  type,
}: {
  actor: string;
  message: string;
  timestamp: string;
  type: string;
}) {
  const relTime = (() => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 2) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  })();

  const iconColor =
    type === "status_change"
      ? "text-[#254fad]"
      : type === "created"
      ? "text-[#006400]"
      : "text-brand-muted";

  return (
    <div className="flex gap-3 items-start">
      <div
        className={cn(
          "mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ring-2 ring-white",
          type === "status_change"
            ? "bg-[#254fad]"
            : type === "created"
            ? "bg-[#006400]"
            : "bg-brand-border-strong"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-brand-body leading-[1.5]">
          <span className="font-semibold text-brand-ink">{actor}</span>{" "}
          {message}
        </p>
        <p className="text-[10px] text-brand-muted font-medium mt-0.5">{relTime}</p>
      </div>
    </div>
  );
}

export function KanbanTaskDetailPanel({
  task,
  isOpen,
  onClose,
  onTaskUpdate,
  actorName,
  canEdit = true,
}: KanbanTaskDetailPanelProps) {
  const [newNote, setNewNote] = React.useState("");
  const [updatingStage, setUpdatingStage] = React.useState(false);
  const [updatingProgress, setUpdatingProgress] = React.useState(false);
  const [addingNote, setAddingNote] = React.useState(false);
  const [progressInput, setProgressInput] = React.useState(task?.progress ?? 0);

  // Sync progress input when task changes
  React.useEffect(() => {
    if (task) setProgressInput(task.progress);
  }, [task?.id, task?.progress]);

  React.useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!task) return null;

  const stageCfg = STAGE_CONFIG[task.stage];
  const priorityCfg = PRIORITY_CONFIG[task.priority];

  const daysLeft = Math.ceil(
    (new Date(task.dueDate).getTime() - Date.now()) / 86400000
  );
  const isOverdue = daysLeft < 0;

  const handleMoveStage = (newStage: KanbanStage) => {
    if (newStage === task.stage) return;
    setUpdatingStage(true);
    try {
      const updated = kanbanService.moveStage(task.id, newStage, actorName);
      onTaskUpdate(updated);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleProgressUpdate = () => {
    if (progressInput === task.progress) return;
    setUpdatingProgress(true);
    try {
      const updated = kanbanService.updateProgress(
        task.id,
        Math.min(100, Math.max(0, progressInput)),
        actorName
      );
      onTaskUpdate(updated);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const updated = kanbanService.addNote(task.id, newNote.trim(), actorName);
      onTaskUpdate(updated);
      setNewNote("");
    } finally {
      setAddingNote(false);
    }
  };

  const progressColor =
    task.progress >= 80
      ? "#006400"
      : task.progress >= 50
      ? "#254fad"
      : task.progress >= 20
      ? "#d9a441"
      : "#9297a0";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-brand-ink/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col bg-white shadow-2xl"
          >
            {/* Accent top */}
            <div
              className="h-[4px] w-full shrink-0"
              style={{ background: stageCfg.accentBar }}
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-brand-hairline px-6 py-5 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span
                    className={cn(
                      "rounded-[5px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      stageCfg.color,
                      "bg-white border-current/20"
                    )}
                    style={{ borderColor: stageCfg.accentBar + "44" }}
                  >
                    {stageCfg.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-[5px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      priorityCfg.bg,
                      priorityCfg.text,
                      priorityCfg.border
                    )}
                  >
                    {task.priority}
                  </span>
                </div>
                <h2 className="text-[18px] font-medium leading-[1.35] text-brand-ink line-clamp-2">
                  {task.jobTitle}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-brand-muted font-medium">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {task.companyName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-[8px] border border-brand-hairline p-1.5 text-brand-muted hover:bg-brand-surface-soft hover:text-brand-ink transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: DollarSign, label: "Quoted", value: `$${task.proposedBudget.toLocaleString()}` },
                  {
                    icon: isOverdue ? Building2 : Clock,
                    label: "Deadline",
                    value: isOverdue
                      ? `${Math.abs(daysLeft)}d over`
                      : daysLeft === 0
                      ? "Today"
                      : `${daysLeft}d left`,
                    valueClass: isOverdue ? "text-[#aa2d00]" : daysLeft <= 3 ? "text-[#d9a441]" : "text-brand-ink",
                  },
                  { icon: User, label: "Assignee", value: task.studentName.split(" ")[0] },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col gap-1 rounded-[10px] border border-brand-hairline bg-brand-surface-soft px-3 py-2.5"
                  >
                    <div className="flex items-center gap-1 text-brand-muted">
                      <s.icon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        {s.label}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold truncate",
                        (s as any).valueClass || "text-brand-ink"
                      )}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Progress
                  </h4>
                  <span className="text-sm font-bold" style={{ color: progressColor }}>
                    {task.progress}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-brand-surface-strong overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: progressColor }}
                  />
                </div>

                {/* Progress updater */}
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={progressInput}
                      onChange={(e) => setProgressInput(Number(e.target.value))}
                      className="flex-1 h-2 cursor-pointer accent-brand-ink"
                    />
                    <span className="text-xs font-bold text-brand-ink w-8 text-right">
                      {progressInput}%
                    </span>
                    <button
                      onClick={handleProgressUpdate}
                      disabled={updatingProgress || progressInput === task.progress}
                      className="flex items-center gap-1 rounded-[7px] border border-brand-hairline bg-white px-2.5 py-1.5 text-[11px] font-semibold text-brand-ink hover:bg-brand-surface-soft disabled:opacity-40 transition-colors"
                    >
                      {updatingProgress ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Move stage */}
              {canEdit && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2.5">
                    Move to Stage
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {KANBAN_STAGES.map((s) => {
                      const sc = STAGE_CONFIG[s];
                      const isActive = s === task.stage;
                      return (
                        <button
                          key={s}
                          onClick={() => handleMoveStage(s)}
                          disabled={isActive || updatingStage}
                          className={cn(
                            "flex items-center gap-1.5 rounded-[7px] border px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                            isActive
                              ? "border-transparent text-white"
                              : "border-brand-hairline bg-white text-brand-muted hover:border-brand-border-strong hover:text-brand-ink"
                          )}
                          style={
                            isActive
                              ? { background: sc.accentBar }
                              : undefined
                          }
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ background: isActive ? "white" : sc.dotColor }}
                          />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {task.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-[6px] bg-brand-surface-soft border border-brand-hairline px-2.5 py-1 text-xs font-medium text-brand-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Log */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Activity Log ({task.activityLog.length})
                </h4>
                <div className="relative pl-3.5 space-y-3.5">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[5px] top-0 bottom-0 w-px bg-brand-hairline" />
                  {task.activityLog.map((entry) => (
                    <ActivityItem
                      key={entry.id}
                      actor={entry.actorName}
                      message={entry.message}
                      timestamp={entry.timestamp}
                      type={entry.type}
                    />
                  ))}
                </div>
              </div>

              {/* Add note */}
              {canEdit && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                    Add Note
                  </h4>
                  <div className="flex gap-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a note or update…"
                      rows={2}
                      className="flex-1 rounded-[8px] border border-brand-hairline bg-white px-3 py-2 text-xs text-brand-ink placeholder:text-brand-muted outline-none focus:border-brand-info-border resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote();
                      }}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || addingNote}
                      className="self-end rounded-[8px] bg-brand-ink px-3 py-2 text-xs font-semibold text-white hover:bg-brand-primary-active active:scale-[0.97] transition-all disabled:opacity-40 flex items-center gap-1"
                    >
                      {addingNote ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-brand-muted">⌘ + Enter to submit</p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
