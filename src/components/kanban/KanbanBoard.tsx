"use client";

import * as React from "react";
import {
  Search,
  X,
  Kanban,
  FolderOpen,
  ChevronDown,
} from "lucide-react";
import { KanbanTask, KanbanStage, KANBAN_STAGES, STAGE_CONFIG } from "@/types/kanban";
import { kanbanService } from "@/lib/kanban-service";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTaskDetailPanel } from "./KanbanTaskDetailPanel";
import { KanbanStatsBar } from "./KanbanStatsBar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tasks: KanbanTask[];
  actorName: string;
  canEdit?: boolean;
  onTasksChange: (tasks: KanbanTask[]) => void;
}

export function KanbanBoard({
  tasks,
  actorName,
  canEdit = true,
  onTasksChange,
}: KanbanBoardProps) {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<KanbanTask | null>(null);
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("All");
  const [toastMsg, setToastMsg] = React.useState("");
  const [showToast, setShowToast] = React.useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  };

  // Filtered tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.jobTitle.toLowerCase().includes(q) ||
        t.studentName.toLowerCase().includes(q) ||
        t.companyName.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [tasks, search, priorityFilter]);

  // Group by stage
  const tasksByStage = React.useMemo(() => {
    const map: Record<KanbanStage, KanbanTask[]> = {
      Pending: [],
      "In Progress": [],
      Revision: [],
      Completed: [],
      Paid: [],
    };
    filteredTasks.forEach((t) => map[t.stage].push(t));
    return map;
  }, [filteredTasks]);

  // ── Drag handlers ────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStage: KanbanStage) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.stage === targetStage) return;

    const prevStage = task.stage;
    const updated = kanbanService.moveStage(taskId, targetStage, actorName);
    onTasksChange(tasks.map((t) => (t.id === taskId ? updated : t)));

    // Update detail panel if open
    if (selectedTask?.id === taskId) {
      setSelectedTask(updated);
    }

    triggerToast(`"${task.jobTitle}" moved to ${targetStage}`);
    setDraggingId(null);
  };

  // ── Task update handler ──────────────────────────────────────────────
  const handleTaskUpdate = (updated: KanbanTask) => {
    onTasksChange(tasks.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <KanbanStatsBar tasks={tasks} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, assignees, tags…"
            className="w-full h-11 pl-10 pr-10 text-sm bg-white rounded-[10px] border border-brand-hairline outline-none focus:border-brand-info-border shadow-sm placeholder:text-brand-muted text-brand-ink"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1 rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-1 h-11 shrink-0">
          {["All", "High", "Medium", "Low"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={cn(
                "rounded-[8px] px-3 h-full text-xs font-semibold transition-colors",
                priorityFilter === p
                  ? "bg-white text-brand-ink shadow-sm"
                  : "text-brand-muted"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Search result count */}
      {search && (
        <p className="text-xs text-brand-muted font-medium">
          Showing{" "}
          <span className="font-bold text-brand-ink">{filteredTasks.length}</span>{" "}
          of {tasks.length} tasks
        </p>
      )}

      {/* Board: horizontal scroll */}
      <div className="overflow-x-auto pb-4 -mx-1 px-1">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {KANBAN_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              tasks={tasksByStage[stage]}
              onTaskClick={(task) => setSelectedTask(task)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              draggingId={draggingId}
            />
          ))}
        </div>
      </div>

      {/* Empty board state */}
      {tasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-[12px] border border-brand-hairline bg-white py-20 text-center"
        >
          <div className="h-14 w-14 rounded-[12px] bg-brand-surface-soft border border-brand-hairline/50 flex items-center justify-center text-brand-muted mb-4">
            <Kanban className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-brand-ink mb-1">
            No workflow tasks yet
          </h3>
          <p className="text-xs text-brand-muted max-w-xs leading-relaxed">
            Accepted applications automatically appear here as tasks to manage through the pipeline.
          </p>
        </motion.div>
      )}

      {/* Detail panel */}
      <KanbanTaskDetailPanel
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdate={handleTaskUpdate}
        actorName={actorName}
        canEdit={canEdit}
      />

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-[10px] bg-brand-ink px-4 py-3 text-sm font-medium text-white shadow-lg border border-white/10"
          >
            <span className="h-2 w-2 rounded-full bg-brand-mint shrink-0" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
