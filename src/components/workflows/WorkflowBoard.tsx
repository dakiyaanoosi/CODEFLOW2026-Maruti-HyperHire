"use client";

import * as React from "react";
import { Workflow, WorkflowColumn, WorkflowTask, WorkflowActivity } from "@/types/workflow";
import { workflowService } from "@/lib/workflow-service";
import { WorkflowColumn as ColumnComponent } from "./WorkflowColumn";
import { WorkflowTaskDetail } from "./WorkflowTaskDetail";
import { WorkflowActivityFeed } from "./WorkflowActivityFeed";

interface WorkflowBoardProps {
  workflow: Workflow;
  columns: WorkflowColumn[];
  tasks: WorkflowTask[];
  activities: WorkflowActivity[];
  actorId: string;
  actorName: string;
}

export function WorkflowBoard({
  workflow,
  columns,
  tasks,
  activities,
  actorId,
  actorName,
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

    // Optimistic UI could be handled by local state, but we rely on onSnapshot speed here
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
    
    setDraggingId(null);
  };

  const handleTaskClick = (task: WorkflowTask) => {
    setSelectedTask(task);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-full gap-4" style={{ minWidth: "max-content" }}>
          {columns.map((col) => (
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

      {/* Activity Feed Sidebar */}
      <div className="hidden lg:block w-[320px] shrink-0 border-l border-brand-hairline pl-6 overflow-y-auto">
        <WorkflowActivityFeed activities={activities} />
      </div>

      {/* Detail Panel */}
      <WorkflowTaskDetail
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        actorName={actorName}
        workflow={workflow}
        columns={columns}
      />
    </div>
  );
}
