"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { kanbanService } from "@/lib/kanban-service";
import { KanbanTask } from "@/types/kanban";
import { KanbanBoard } from "@/components/kanban";
import { Loader2, Kanban } from "lucide-react";

export default function KanbanPage() {
  const { user, profile } = useAuthStore();
  const [tasks, setTasks] = React.useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const actorName = profile?.name || user?.displayName || "User";
  const isBusiness = profile?.role === "business";

  React.useEffect(() => {
    if (!user?.uid || !profile) return;

    // Seed mock data so the board always has something to show
    kanbanService.seedMockTasks(user.uid, user.uid);

    const loaded = isBusiness
      ? kanbanService.getTasksByBusiness(user.uid)
      : kanbanService.getTasksByStudent(user.uid);

    // For demo: students see all mock tasks (as if they were the freelancer)
    const final =
      loaded.length > 0
        ? loaded
        : kanbanService.getTasksByBusiness(user.uid); // fallback to all seeded

    setTasks(final);
    setIsLoading(false);
  }, [user, profile, isBusiness]);

  if (!user || !profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-sm text-brand-muted font-medium">
            Resolving session…
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink flex items-center gap-2.5">
            <Kanban className="h-8 w-8 text-brand-ink shrink-0" />
            Workflow Board
          </h1>
          <p className="mt-1.5 text-sm text-brand-body max-w-xl leading-relaxed">
            {isBusiness
              ? "Track every active gig through its lifecycle — from kick-off to payment. Drag cards between stages, update progress, and log activity."
              : "See the real-time status of all your active gig engagements. Drag tasks to update stages and keep your clients in the loop."}
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-[10px] border border-brand-hairline bg-brand-surface-soft px-3.5 py-2.5 shrink-0 self-start">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#006400] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#006400]" />
          </span>
          <p className="text-xs font-semibold text-brand-ink">Live board</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-brand-hairline" />

      {/* Board */}
      <KanbanBoard
        tasks={tasks}
        actorName={actorName}
        canEdit={true}
        onTasksChange={setTasks}
      />
    </div>
  );
}
