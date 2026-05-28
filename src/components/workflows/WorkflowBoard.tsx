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
      {/* 4-column Board Container */}
      <div className="flex-1 overflow-x-auto min-w-0">
        <div className="flex gap-5 min-h-[600px] pb-4">
          {columns.map((col) => {
            // Determine if column can receive new tasks
            let onAddTask: (() => void) | undefined;
            if (col.name === "Execution Work" && actorRole === "student") {
              onAddTask = () => onOpenCreateTask("execution");
            } else if (col.name === "Review/Revisions" && actorRole === "business") {
              onAddTask = () => onOpenCreateTask("revision");
            }

            // Filter tasks for this column based on mapped status
            const filteredTasks = tasks.filter((t) => {
              if (col.name === "Execution Work") {
                return t.status === "pending" || t.status === "in_progress";
              }
              if (col.name === "Deliverables") {
                return t.status === "submitted";
              }
              if (col.name === "Review/Revisions") {
                return t.status === "revision_requested";
              }
              if (col.name === "Completed Work") {
                return t.status === "approved";
              }
              // Fallback support for old columns
              if (col.name === "Pending") return t.status === "pending";
              if (col.name === "In Progress") return t.status === "in_progress";
              if (col.name === "Revision") return t.status === "revision_requested";
              if (col.name === "Completed" || col.name === "Paid") return t.status === "approved";
              return t.columnId === col.columnId;
            });

            return (
              <ColumnComponent
                key={col.columnId}
                column={col}
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                draggingId={draggingId}
                workflow={workflow}
                actorRole={actorRole}
                onAddTask={onAddTask}
              />
            );
          })}
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
