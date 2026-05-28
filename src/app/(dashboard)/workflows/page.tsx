"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { collaborationService } from "@/lib/collaboration-service";
import { Collaboration, CollaborationStatus } from "@/types/collaboration";
import { Loader2, KanbanSquare, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<CollaborationStatus, { label: string; color: string }> = {
  setup_pending: { label: "Setup", color: "bg-brand-surface-strong text-brand-ink" },
  scope_review: { label: "Scope Review", color: "bg-brand-info/10 text-brand-info" },
  awaiting_funding: { label: "Awaiting Funding", color: "bg-brand-mustard/10 text-[#8a6200]" },
  active: { label: "Active", color: "bg-brand-primary/10 text-brand-ink" },
  in_review: { label: "In Review", color: "bg-brand-info/10 text-brand-info" },
  revision_requested: { label: "Revision", color: "bg-brand-warning/10 text-brand-warning" },
  completed: { label: "Completed", color: "bg-brand-success/10 text-brand-success" },
  cancelled: { label: "Cancelled", color: "bg-brand-coral/10 text-brand-coral" },
  disputed: { label: "Disputed", color: "bg-brand-coral/10 text-brand-coral" },
};

export default function WorkflowsPage() {
  const { user, profile } = useAuthStore();
  const [collaborations, setCollaborations] = React.useState<Collaboration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const isBusiness = profile?.role === "business";

  React.useEffect(() => {
    if (!user?.uid || !profile) return;

    const unsubscribe = collaborationService.subscribeToUserCollaborations(
      user.uid,
      isBusiness ? "business" : "student",
      (data) => {
        setCollaborations(data);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, profile, isBusiness]);

  if (!user || !profile || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  if (collaborations.length === 0) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center rounded-[12px] border border-brand-hairline bg-white text-center p-8 shadow-sm">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-surface-soft border border-brand-hairline mb-5 relative">
          <KanbanSquare className="h-7 w-7 text-brand-muted" />
          <div className="absolute -bottom-1 -right-1 bg-brand-secondary text-white rounded-full p-1 border-2 border-white">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-brand-ink mb-2">
          {isBusiness ? "Your Project Execution Hub" : "Your Collaborative Workspaces"}
        </h3>
        
        <p className="max-w-md text-sm text-brand-muted leading-relaxed font-medium mb-8">
          {isBusiness 
            ? "When you accept an application, a dedicated collaboration workspace is automatically created here to manage tasks and deliverables." 
            : "When a business accepts your application, your secure workspace will appear here for project management and delivery."}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-sm text-left">
          <div className="flex items-center gap-3 p-3 bg-brand-surface-soft/50 rounded-[10px] border border-brand-hairline">
            <div className="bg-white p-2 rounded-md shadow-sm border border-brand-hairline">
              <Sparkles className="w-4 h-4 text-brand-secondary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-ink">AI-Powered Orchestration</p>
              <p className="text-xs text-brand-muted mt-0.5">Automated milestones & risk analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-brand-surface-soft/50 rounded-[10px] border border-brand-hairline">
            <div className="bg-white p-2 rounded-md shadow-sm border border-brand-hairline">
              <KanbanSquare className="w-4 h-4 text-brand-ink" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-ink">Real-time Delivery</p>
              <p className="text-xs text-brand-muted mt-0.5">Live syncing & file sharing</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-normal leading-[1.2] text-brand-ink flex items-center gap-2.5">
            <KanbanSquare className="h-8 w-8 text-brand-ink shrink-0" />
            Collaborations
          </h1>
          <p className="mt-1.5 text-sm text-brand-body max-w-xl leading-relaxed">
            {isBusiness
              ? "Manage execution and deliverables for your active projects."
              : "Track your ongoing engagements and project milestones."}
          </p>
        </div>
      </div>

      <div className="border-t border-brand-hairline" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {collaborations.map((collab) => {
          const statusConfig = STATUS_CONFIG[collab.status] || STATUS_CONFIG.active;
          const isTerminal = collab.status === "completed" || collab.status === "cancelled";

          return (
            <Link
              key={collab.collaborationId}
              href={`/workflows/${collab.workflowId}`}
              className="group flex flex-col rounded-[12px] border border-brand-hairline bg-white p-5 transition-shadow hover:shadow-md hover:border-brand-primary/30 relative overflow-hidden"
            >
              {isTerminal && (
                <div className={cn(
                  "absolute top-0 right-0 h-1 w-full",
                  collab.status === "completed" ? "bg-brand-success" : "bg-brand-coral"
                )} />
              )}
              {collab.status === "active" && (
                <div className="absolute top-0 left-0 h-1 w-1/3 bg-brand-primary" />
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-brand-ink truncate pr-4">
                    {collab.title}
                  </h3>
                  <p className="text-xs text-brand-muted mt-1">
                    {isBusiness ? collab.studentName : collab.businessName}
                  </p>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase shrink-0",
                  statusConfig.color
                )}>
                  {statusConfig.label}
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-center text-xs text-brand-muted">
                  <span className="flex items-center gap-1">
                    {collab.status === "revision_requested" && <AlertCircle className="w-3 h-3 text-brand-warning" />}
                    Updated {formatDistanceToNow(new Date(collab.updatedAt))} ago
                  </span>
                  {collab.agreedBudget ? (
                    <span className="font-medium text-brand-ink">₹{collab.agreedBudget.toLocaleString("en-IN")}</span>
                  ) : null}
                </div>

                <div className="flex items-center text-xs font-semibold text-brand-primary group-hover:text-brand-primary/80 transition-colors">
                  Open Workspace <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
