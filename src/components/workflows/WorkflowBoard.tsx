"use client";

import * as React from "react";
import { Workflow, WorkflowColumn, WorkflowTask, WorkflowActivity } from "@/types/workflow";
import { workflowService } from "@/lib/workflow-service";
import { WorkflowColumn as ColumnComponent } from "./WorkflowColumn";
import { WorkflowTaskDetail } from "./WorkflowTaskDetail";
import { WorkflowActivityFeed } from "./WorkflowActivityFeed";

import { CollaborationStatus } from "@/types/collaboration";
import { canMoveTask } from "@/lib/collaboration/permission-policy";

interface WorkflowBoardProps {
  workflow: Workflow;
  columns: WorkflowColumn[];
  tasks: WorkflowTask[];
  activities: WorkflowActivity[];
  actorId: string;
  actorName: string;
  actorRole: "student" | "business";
  collaborationStatus: CollaborationStatus;
  onOpenCreateTask: (type: WorkflowTask["taskType"]) => void;
}

export function WorkflowBoard({
  workflow,
  columns,
  tasks,
  activities,
  actorId,
  actorName,
  actorRole,
  collaborationStatus,
  onOpenCreateTask,
}: WorkflowBoardProps) {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<WorkflowTask | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find((t) => t.taskId === taskId);
    if (!task || task.columnId === targetColumnId) return;

    const targetCol = columns.find(c => c.columnId === targetColumnId);
    if (!targetCol) return;

    const currentCol = columns.find(c => c.columnId === task.columnId);
    const currentColName = currentCol ? currentCol.name : "Pending";

    if (!canMoveTask(actorId, actorRole, collaborationStatus, task, currentColName, targetCol.name)) {
      alert(`Permission Denied: You cannot move this task from '${currentColName}' to '${targetCol.name}' as a '${actorRole}'.`);
      setDraggingId(null);
      return;
    }

    try {
      await workflowService.moveTask(
        workflow.workflowId,
        taskId,
        targetColumnId,
        targetCol.name,
        actorId,
        actorName,
        workflow.studentId,
        workflow.businessId
      );
    } catch (err: any) {
      alert(err.message || "Failed to move task.");
    }
    
    setDraggingId(null);
  };

  const handleTaskClick = (task: WorkflowTask) => {
    setSelectedTask(task);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-y-auto pb-8">
      {/* Restructured Workspace Panels */}
      <div className="flex-1 space-y-8">
        
        {/* 1. Freelancer Execution Workspace */}
        <div className="rounded-xl border border-brand-hairline bg-brand-surface-soft/10 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-hairline pb-2.5">
            <div>
              <h3 className="text-base font-semibold text-brand-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                freelancer Execution Board
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">Tasks created and managed by student/freelancer for execution</p>
            </div>
            {actorRole === "student" && (
              <button
                onClick={() => onOpenCreateTask("general")}
                className="px-3.5 py-1.5 bg-brand-ink text-white rounded-[6px] text-xs font-semibold hover:bg-brand-primary-active transition-all"
              >
                + Add Task
              </button>
            )}
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-4">
            {columns.filter(c => c.name === "Pending" || c.name === "In Progress").map((col) => (
              <ColumnComponent
                key={col.columnId}
                column={col}
                tasks={tasks.filter((t) => t.columnId === col.columnId)}
                onTaskClick={handleTaskClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                draggingId={draggingId}
                workflow={workflow}
              />
            ))}
          </div>
        </div>

        {/* 2. Client Review Panel */}
        <div className="rounded-xl border border-brand-hairline bg-brand-surface-soft/10 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-hairline pb-2.5">
            <div>
              <h3 className="text-base font-semibold text-[#8a6200] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-mustard" />
                Client Review Panel
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">Revision and completion feedback tracked by client/business</p>
            </div>
            {actorRole === "business" && (
              <button
                onClick={() => onOpenCreateTask("revision")}
                className="px-3.5 py-1.5 bg-brand-ink text-white rounded-[6px] text-xs font-semibold hover:bg-brand-primary-active transition-all"
              >
                + Add Review Task
              </button>
            )}
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-4">
            {columns.filter(c => c.name === "Revision" || c.name === "Completed").map((col) => (
              <ColumnComponent
                key={col.columnId}
                column={col}
                tasks={tasks.filter((t) => t.columnId === col.columnId)}
                onTaskClick={handleTaskClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                draggingId={draggingId}
                workflow={workflow}
              />
            ))}
          </div>
        </div>

        {/* 3. Paid & Completed Archives */}
        <div className="rounded-xl border border-brand-hairline bg-brand-surface-soft/10 p-5 space-y-4">
          <div className="border-b border-brand-hairline pb-2.5">
            <h3 className="text-base font-semibold text-brand-success flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-success" />
              Released & Completed
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">Approved items and terminal states</p>
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-4">
            {columns.filter(c => c.name === "Paid").map((col) => (
              <ColumnComponent
                key={col.columnId}
                column={col}
                tasks={tasks.filter((t) => t.columnId === col.columnId)}
                onTaskClick={handleTaskClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                draggingId={draggingId}
                workflow={workflow}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed Sidebar */}
      <div className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-brand-hairline pt-6 lg:pt-0 lg:pl-6 overflow-y-auto">
        <WorkflowActivityFeed activities={activities} />
      </div>

      {/* Detail Panel */}
      <WorkflowTaskDetail
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        actorId={actorId}
        actorRole={actorRole}
        actorName={actorName}
        workflow={workflow}
        columns={columns}
      />
    </div>
  );
}
