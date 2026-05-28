"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { workflowService } from "@/lib/workflow-service";
import { collaborationService } from "@/lib/collaboration-service";
import { aiWorkflowService } from "@/lib/ai-workflow-service";
import { escrowService } from "@/lib/escrow-service";
import { milestoneService } from "@/lib/milestone-service";
import { Milestone } from "@/types/milestone";
import { Workflow, WorkflowColumn, WorkflowTask, WorkflowActivity, TaskStatus } from "@/types/workflow";
import { Collaboration, CollaborationStatus } from "@/types/collaboration";
import { Escrow } from "@/types/escrow";
import { WorkflowBoard } from "@/components/workflows/WorkflowBoard";
import { 
  Loader2, 
  ArrowLeft, 
  BrainCircuit, 
  CheckCircle2, 
  Send, 
  Banknote, 
  ShieldAlert, 
  Clock, 
  Wallet, 
  Info 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { reviewService } from "@/lib/review-service";
import { BusinessReviewModal } from "@/components/reviews/BusinessReviewModal";
import { StudentReviewModal } from "@/components/reviews/StudentReviewModal";
import { 
  canCreateTask, 
  canFundEscrow, 
  canReleaseEscrow, 
  canDisputeEscrow, 
  canSubmitDeliverable, 
  canRequestRevision, 
  canApproveDeliverable,
  canSubmitMilestone,
  canReviewMilestone
} from "@/lib/collaboration/permission-policy";
import { EscrowStatusBadge } from "@/components/escrow/EscrowStatusBadge";
import { EscrowTimeline } from "@/components/escrow/EscrowTimeline";
import { WorkflowActivityFeed } from "@/components/workflows/WorkflowActivityFeed";

// ─── Status Configuration ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CollaborationStatus, { label: string; color: string; bgColor: string }> = {
  setup_pending: { label: "Setup Pending", color: "text-brand-ink", bgColor: "bg-brand-surface-strong" },
  scope_review: { label: "Scope Review", color: "text-brand-info", bgColor: "bg-brand-info/10" },
  awaiting_funding: { label: "Awaiting Funding", color: "text-[#8a6200]", bgColor: "bg-brand-mustard/10" },
  active: { label: "Active", color: "text-brand-ink", bgColor: "bg-brand-primary/10" },
  in_review: { label: "In Review", color: "text-brand-info", bgColor: "bg-brand-info/10" },
  revision_requested: { label: "Revision Requested", color: "text-brand-warning", bgColor: "bg-brand-warning/10" },
  completed: { label: "Completed", color: "text-brand-success", bgColor: "bg-brand-success/10" },
  cancelled: { label: "Cancelled", color: "text-brand-coral", bgColor: "bg-brand-coral/10" },
  disputed: { label: "Disputed", color: "text-brand-coral", bgColor: "bg-brand-coral/10" },
};

export default function WorkspacePage({ params }: { params: Promise<{ workflowId: string }> }) {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const unwrappedParams = React.use(params);
  const workflowId = unwrappedParams.workflowId;

  const [workflow, setWorkflow] = React.useState<Workflow | null>(null);
  const [collaboration, setCollaboration] = React.useState<Collaboration | null>(null);
  const [milestones, setMilestones] = React.useState<Milestone[]>([]);
  const [activeMilestoneId, setActiveMilestoneId] = React.useState<string | null>(null);
  const [columns, setColumns] = React.useState<WorkflowColumn[]>([]);
  const [tasks, setTasks] = React.useState<WorkflowTask[]>([]);
  const [activities, setActivities] = React.useState<WorkflowActivity[]>([]);
  const [escrow, setEscrow] = React.useState<Escrow | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
  const [submitNote, setSubmitNote] = React.useState("");
  const [reviewNote, setReviewNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Task creation states
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = React.useState(false);
  const [createTaskType, setCreateTaskType] = React.useState<WorkflowTask["taskType"]>("execution");
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskDescription, setTaskDescription] = React.useState("");
  const [taskPriority, setTaskPriority] = React.useState<"Low" | "Medium" | "High">("Medium");
  const [taskDueDate, setTaskDueDate] = React.useState("");

  // Review states
  const [isBusinessReviewOpen, setIsBusinessReviewOpen] = React.useState(false);
  const [isStudentReviewOpen, setIsStudentReviewOpen] = React.useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = React.useState(false);

  // AI Insights State
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiInsight, setAiInsight] = React.useState<{ summary: string; insight: string; risk: string } | null>(null);

  const actorName = profile?.name || user?.displayName || "User";
  const isBusiness = profile?.role === "business";

  React.useEffect(() => {
    if (!workflowId || !user || !profile) return;

    // Load Workflow metadata
    workflowService.getWorkflow(workflowId).then((data) => {
      if (!data) {
        router.replace("/workflows");
        return;
      }
      setWorkflow(data);
    });

    // Load Collaboration by workflowId
    let unSubCollab: (() => void) | undefined;
    let unSubMilestones: (() => void) | undefined;

    collaborationService.getCollaborationByWorkflowId(workflowId).then((collab) => {
      if (collab) {
        setCollaboration(collab);
        unSubCollab = collaborationService.subscribeToCollaboration(
          collab.collaborationId,
          setCollaboration
        );

        unSubMilestones = milestoneService.subscribeToMilestones(
          collab.collaborationId,
          (msList) => {
            if (msList.length === 0) {
              milestoneService.createDefaultMilestones(collab.collaborationId, collab.businessId);
              return;
            }
            setMilestones(msList);
            setActiveMilestoneId((currentId) => {
              if (currentId && msList.some((m) => m.milestoneId === currentId)) {
                return currentId;
              }
              const active = msList.find((m) => m.status === "active" || m.status === "revision_requested" || m.status === "in_review");
              return active ? active.milestoneId : msList[0]?.milestoneId || null;
            });
          }
        );
      }
    });

    reviewService.hasSubmittedReview(user.uid, workflowId).then(setHasSubmittedReview);

    const unSubCols = workflowService.subscribeToColumns(workflowId, setColumns);
    const unSubTasks = workflowService.subscribeToTasks(workflowId, (newTasks) => {
      setTasks(newTasks);
      setIsLoading(false);
    });
    const unSubAct = workflowService.subscribeToActivity(workflowId, setActivities);

    const unSubEscrow = escrowService.subscribeToEscrows(
      user.uid,
      profile.role as "student" | "business",
      (escrows) => {
        const matched = escrows.find((e) => e.workflowId === workflowId);
        if (matched) {
          setEscrow(matched);
        }
      }
    );

    return () => {
      unSubCols();
      unSubTasks();
      unSubAct();
      unSubEscrow();
      if (unSubCollab) unSubCollab();
      if (unSubMilestones) unSubMilestones();
    };
  }, [workflowId, router, user, profile]);

  // ─── Actions derived from collaboration.status ──────────────────────────────

  const handleSubmitWork = async () => {
    if (!activeMilestoneId || !user || !profile) return;
    if (!submitNote.trim()) {
      setActionError("Please describe what you are delivering.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      await milestoneService.submitMilestoneForReview(activeMilestoneId, submitNote.trim(), user.uid);
      setIsSubmitModalOpen(false);
      setSubmitNote("");
    } catch (e: any) {
      setActionError(e.message || "Failed to submit milestone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!activeMilestoneId || !user || !profile) return;
    if (!reviewNote.trim()) {
      setActionError("Please provide revision feedback instructions.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      await milestoneService.requestMilestoneRevision(activeMilestoneId, reviewNote.trim(), user.uid);
      setIsReviewModalOpen(false);
      setReviewNote("");
    } catch (e: any) {
      setActionError(e.message || "Failed to request milestone revision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Operational approval transitions milestone status to 'approved'
  const handleApproveProject = async () => {
    if (!activeMilestoneId || !user || !profile) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await milestoneService.approveMilestone(activeMilestoneId, reviewNote.trim() || "Milestone approved.", user.uid);
      setIsReviewModalOpen(false);
      setReviewNote("");
    } catch (e: any) {
      setActionError(e.message || "Failed to approve milestone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Financial payout release updates escrow status to 'released'
  const handleReleaseEscrow = async () => {
    if (!escrow || !collaboration || !user || !profile) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await escrowService.releaseEscrow(escrow.escrowId, user.uid, profile.role as any);
      setIsBusinessReviewOpen(true);
    } catch (e: any) {
      setActionError(e.message || "Failed to release escrow payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!workflow || !profile) return;
    setIsAnalyzing(true);
    
    let milestoneDeliverables: any[] = [];
    if (activeMilestoneId) {
      try {
        const { deliverableService } = await import("@/lib/deliverable-service");
        milestoneDeliverables = await deliverableService.getDeliverablesByMilestone(activeMilestoneId);
      } catch (err) {
        console.error("Error loading deliverables for AI analysis:", err);
      }
    }
    
    const result = await aiWorkflowService.analyzeWorkflow(
      workflow.jobTitle,
      "Application requirements context.", 
      tasks,
      profile.role as any,
      milestoneDeliverables
    );

    setAiInsight({
      summary: result.summary,
      insight: result.productivity_insight,
      risk: result.risk_level
    });
    setIsAnalyzing(false);
  };

  const handleCreateTask = async () => {
    if (!workflow || !profile || !user) return;
    if (!taskTitle.trim()) {
      alert("Please enter a task title.");
      return;
    }

    const defaultColumn = columns[0]?.columnId;
    if (!defaultColumn) {
      alert("Workflow columns are not loaded yet.");
      return;
    }

    let ownerId = workflow.studentId;
    let ownerRole: "student" | "business" = "student";
    let assignedTo = workflow.studentId;
    let assignedRole: "student" | "business" = "student";

    if (profile.role === "business") {
      ownerId = workflow.businessId;
      ownerRole = "business";
      assignedTo = workflow.studentId;
      assignedRole = "student";
    }

    const newTask: Omit<WorkflowTask, "taskId" | "createdAt" | "updatedAt"> = {
      workflowId: workflow.workflowId,
      columnId: defaultColumn,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      priority: taskPriority,
      assigneeId: assignedTo,
      dueDate: taskDueDate || undefined,
      attachments: [],
      aiSuggestions: [],
      status: "pending",
      studentId: workflow.studentId,
      businessId: workflow.businessId,
      createdBy: user.uid,
      ownerId,
      ownerRole,
      assignedTo,
      assignedRole,
      taskType: createTaskType,
    };

    try {
      await workflowService.addTask(newTask);
      setIsCreateTaskModalOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("Medium");
      setTaskDueDate("");
    } catch (err: any) {
      alert(err.message || "Failed to create task.");
    }
  };

  if (!user || !profile || isLoading || !workflow) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  // ─── Derive display state from collaboration ─────────────────────────────────

  const collabStatus = collaboration?.status || "active";
  const statusConfig = STATUS_CONFIG[collabStatus] || STATUS_CONFIG.active;

  // Calculate Progress (Dynamic based on completed tasks)
  const completedTasks = tasks.filter(t => t.status === "approved" || columns.find(c => c.columnId === t.columnId)?.name === "Completed Work").length;
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  // ─── Action Visibility (derived from activeMilestone.status) ────────────────────

  const activeMilestone = milestones.find(m => m.milestoneId === activeMilestoneId);
  const canStudentSubmit = activeMilestone ? canSubmitMilestone(profile?.role as any, activeMilestone.status) : false;
  const canBusinessReview = activeMilestone ? canReviewMilestone(profile?.role as any, activeMilestone.status) : false;
  const canLeaveReview = collabStatus === "completed" && !hasSubmittedReview;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-hairline pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/workflows" className="p-2 -ml-2 rounded-md hover:bg-brand-surface-soft text-brand-muted hover:text-brand-ink transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-brand-ink">{workflow.jobTitle}</h1>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase",
                statusConfig.bgColor,
                statusConfig.color
              )}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-brand-muted mt-0.5">
              Collaboration between <span className="font-medium text-brand-ink">{workflow.businessName}</span> and <span className="font-medium text-brand-ink">{workflow.studentName}</span>
            </p>
          </div>
        </div>
 
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="hidden md:flex items-center gap-2 mr-2">
            <div className="w-32 h-2 bg-brand-surface-soft rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-primary transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <span className="text-xs font-semibold text-brand-ink">{progressPercent}%</span>
          </div>
 
          {/* Action Buttons based on Operational Loop */}
          {canStudentSubmit && (
            <button
              onClick={() => {
                setActionError(null);
                setIsSubmitModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-ink text-white rounded-[8px] text-sm font-semibold hover:bg-brand-primary transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Submit Milestone for Review
            </button>
          )}

          {canBusinessReview && (
            <button
              onClick={() => {
                setActionError(null);
                setIsReviewModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-success text-white rounded-[8px] text-sm font-semibold hover:bg-brand-success/90 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Review Milestone Submission
            </button>
          )}

          <button 
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3.5 py-2 bg-brand-secondary text-white rounded-[8px] text-sm font-semibold hover:bg-brand-secondary/90 transition-colors disabled:opacity-70"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            AI Analyze
          </button>
        </div>
      </div>

      {/* Lifesycle Banners */}
      {collabStatus === "revision_requested" && (
        <div className="rounded-[10px] bg-brand-warning/5 border border-brand-warning/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-warning/10 text-brand-warning">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-ink">Revision Requested</p>
              <p className="text-xs text-brand-muted mt-0.5">
                {isBusiness 
                  ? `Waiting for ${workflow.studentName} to address your revision notes.` 
                  : `${workflow.businessName} has requested changes. Please review their feedback and resubmit.`}
              </p>
            </div>
          </div>
        </div>
      )}
 
      {collabStatus === "in_review" && !isBusiness && (
        <div className="rounded-[10px] bg-brand-info/5 border border-brand-info/20 p-4 flex items-center gap-3 animate-in fade-in duration-300">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-info/10 text-brand-info">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-ink">Deliverables Under Review</p>
            <p className="text-xs text-brand-muted mt-0.5">
              {workflow.businessName} is reviewing your submission. You will be notified of the outcome.
            </p>
          </div>
        </div>
      )}
 
      {/* Completed + Review Prompt Banner */}
      {canLeaveReview && (
        <div className="rounded-[10px] bg-brand-mint/10 border border-brand-success/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-success/10 text-brand-success">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-ink">Project Completed & Payout Done!</p>
              <p className="text-xs text-brand-muted mt-0.5">
                {isBusiness 
                  ? `Please evaluate your experience collaborating with ${workflow.studentName} to build marketplace trust.` 
                  : `Please evaluate your experience collaborating with ${workflow.businessName}.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isBusiness) {
                setIsBusinessReviewOpen(true);
              } else {
                setIsStudentReviewOpen(true);
              }
            }}
            className="shrink-0 rounded-[8px] bg-brand-ink px-4 py-2 text-xs font-semibold text-white hover:bg-brand-primary-active transition-colors shadow-sm"
          >
            Leave a Review
          </button>
        </div>
      )}
 
      <AnimatePresence>
        {aiInsight && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline p-4 flex gap-4 items-start animate-in fade-in"
          >
            <div className="bg-white p-2 rounded-md shadow-sm border border-brand-hairline shrink-0">
              <BrainCircuit className="w-5 h-5 text-brand-secondary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
                HyperAI Project Analysis
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                  aiInsight.risk === "High" ? "bg-brand-warning/10 text-brand-warning" : 
                  aiInsight.risk === "Medium" ? "bg-[#d9a441]/10 text-[#8a6200]" : "bg-brand-success/10 text-brand-success"
                )}>
                  Risk: {aiInsight.risk}
                </span>
              </h4>
              <p className="text-sm text-brand-muted mt-1 leading-relaxed">{aiInsight.summary}</p>
              <div className="mt-2 text-xs font-medium text-brand-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
                {aiInsight.insight}
              </div>
            </div>
            <button 
              onClick={() => setAiInsight(null)}
              className="text-brand-muted hover:text-brand-ink p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────── TWO COLUMN WORKSPACE GRID ────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Left/Main Column: Work Execution Domain */}
        <div className="lg:col-span-3 flex flex-col min-h-0 overflow-y-auto pr-1">
          {/* Milestones Horizontal Navigation */}
          <div className="mb-6 flex gap-4 overflow-x-auto pb-2.5 scrollbar-thin">
            {milestones.map((m) => {
              const isActive = m.milestoneId === activeMilestoneId;
              return (
                <button
                  key={m.milestoneId}
                  onClick={() => setActiveMilestoneId(m.milestoneId)}
                  className={cn(
                    "flex flex-col text-left p-4 rounded-xl border min-w-[200px] max-w-[240px] transition-all relative shrink-0",
                    isActive 
                      ? "bg-white border-brand-ink shadow-sm ring-1 ring-brand-ink/10"
                      : "bg-brand-surface-soft/40 border-brand-hairline hover:bg-brand-surface-soft hover:border-brand-muted/30"
                  )}
                >
                  <div className="flex justify-between items-start w-full gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Milestone {m.order + 1}</span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                      m.status === "approved" ? "bg-brand-success/10 text-brand-success" :
                      m.status === "in_review" ? "bg-brand-info/10 text-brand-info" :
                      m.status === "revision_requested" ? "bg-brand-warning/10 text-brand-warning" :
                      m.status === "active" ? "bg-brand-primary/10 text-brand-primary" :
                      "bg-brand-surface-strong text-brand-muted"
                    )}>
                      {m.status.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-brand-ink truncate w-full mb-2">{m.title}</h4>
                  
                  {/* Progress bar */}
                  <div className="w-full mt-auto">
                    <div className="flex justify-between items-center text-[9px] text-brand-muted font-medium mb-1">
                      <span>Progress</span>
                      <span>{m.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-brand-surface-strong rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-300",
                          m.status === "approved" ? "bg-brand-success" : "bg-brand-ink"
                        )}
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Milestone Card */}
          {activeMilestone && (
            <div className="mb-6 p-4 rounded-xl border border-brand-hairline bg-white shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-hairline pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-brand-ink flex items-center gap-2">
                    {activeMilestone.title}
                    {activeMilestone.eligibleForRelease && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                        Eligible for Release
                      </span>
                    )}
                  </h3>
                  {activeMilestone.description && (
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">{activeMilestone.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canStudentSubmit && (
                    <button
                      onClick={() => {
                        setActionError(null);
                        setIsSubmitModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-brand-ink text-white rounded-lg text-xs font-semibold hover:bg-brand-primary transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Milestone
                    </button>
                  )}
                  {canBusinessReview && (
                    <button
                      onClick={() => {
                        setActionError(null);
                        setIsReviewModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-brand-success text-white rounded-lg text-xs font-semibold hover:bg-brand-success/90 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Review Submission
                    </button>
                  )}
                </div>
              </div>

              {/* Status block info */}
              {activeMilestone.status === "revision_requested" && activeMilestone.revisionNote && (
                <div className="p-3 rounded-lg border border-brand-warning/20 bg-brand-warning/5 text-xs text-brand-ink">
                  <span className="font-bold text-brand-warning">Revision Feedback:</span> {activeMilestone.revisionNote}
                </div>
              )}
              {activeMilestone.status === "in_review" && (
                <div className="p-3 rounded-lg border border-brand-info/20 bg-brand-info/5 text-xs text-brand-muted">
                  Milestone submitted for review. Client is evaluating deliverables.
                </div>
              )}
              {activeMilestone.status === "approved" && (
                <div className="p-3 rounded-lg border border-brand-success/20 bg-brand-success/5 text-xs text-brand-success font-medium">
                  ✓ Milestone approved and eligible for escrow payout release.
                </div>
              )}
            </div>
          )}

          <WorkflowBoard 
            workflow={workflow}
            columns={columns}
            tasks={tasks.filter(t => {
              if (!t.milestoneId) {
                return activeMilestoneId === milestones[0]?.milestoneId;
              }
              return t.milestoneId === activeMilestoneId;
            })}
            actorId={user.uid}
            actorName={actorName}
            actorRole={profile.role as any}
            collaborationStatus={collabStatus}
            activeMilestoneStatus={activeMilestone?.status}
            onOpenCreateTask={(type) => {
              setCreateTaskType(type);
              setIsCreateTaskModalOpen(true);
            }}
          />
        </div>

        {/* Right Sidebar: Escrow Payment Domain & Activity Timeline */}
        <div className="lg:col-span-1 flex flex-col space-y-6 border-t lg:border-t-0 lg:border-l border-brand-hairline pt-6 lg:pt-0 lg:pl-6 overflow-y-auto shrink-0 min-w-[320px]">
          
          {/* Financial Workspace Escrow Panel */}
          {escrow && (
            <div className="rounded-xl border border-brand-hairline bg-brand-surface-soft/10 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-brand-hairline pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-brand-primary/10 text-brand-primary">
                    <Wallet className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs font-bold text-brand-ink uppercase tracking-wide">Financial Ledger</h3>
                </div>
                <EscrowStatusBadge status={escrow.status} />
              </div>

              {/* Budget Ledger Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-muted font-medium">Total Project Budget</span>
                  <span className="font-bold text-brand-ink">₹{escrow.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-muted font-medium">Platform Fee (10%)</span>
                  <span className="text-brand-muted">₹{(escrow.platformFee ?? escrow.amount * 0.1).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-brand-hairline pt-2">
                  <span className="text-brand-ink font-semibold">Net Student Payout</span>
                  <span className="text-sm font-bold text-brand-success">₹{(escrow.payoutAmount ?? escrow.amount * 0.9).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Milestone Release Progress */}
              <div className="border-t border-brand-hairline pt-3">
                <h4 className="text-[10px] font-bold text-brand-ink uppercase tracking-wider mb-2">Milestone Release Progress</h4>
                <div className="space-y-1.5">
                  {milestones.map((m) => (
                    <div key={m.milestoneId} className="flex items-center justify-between text-xs p-2 rounded bg-white border border-brand-hairline shadow-sm">
                      <span className="font-medium text-brand-ink truncate max-w-[150px]">{m.title}</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                        m.status === "approved" ? "bg-brand-success/15 text-brand-success" : "bg-brand-surface-strong text-brand-muted"
                      )}>
                        {m.status === "approved" ? "Released" : "Locked"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escrow Timeline */}
              <div className="border-t border-brand-hairline pt-3">
                <h4 className="text-[10px] font-bold text-brand-ink uppercase tracking-wider mb-3">Escrow Payout Timeline</h4>
                <EscrowTimeline events={escrow.timeline} />
              </div>

              {/* Payment Release Authority Panel */}
              <div className="border-t border-brand-hairline pt-3 mt-1">
                {escrow.status === "funded" ? (
                  collabStatus === "completed" ? (
                    isBusiness ? (
                      <button
                        onClick={handleReleaseEscrow}
                        disabled={isSubmitting}
                        className="w-full py-2 bg-brand-success hover:bg-brand-success/90 text-white text-xs font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />}
                        Release Escrow Payment
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-md border border-brand-success/20 bg-brand-success/5 text-center text-xs font-medium text-brand-success">
                        ✓ Project Approved. Payment release pending client action.
                      </div>
                    )
                  ) : (
                    <div className="p-2.5 rounded-md border border-brand-hairline bg-white text-center text-[11px] text-brand-muted leading-relaxed">
                      Payment is locked in escrow. It will become releasable once all milestones are approved and collaboration completed.
                    </div>
                  )
                ) : escrow.status === "released" ? (
                  <div className="p-2.5 rounded-md border border-brand-success/20 bg-brand-success/5 text-center text-xs font-semibold text-brand-success">
                    ✓ Escrow Payout Released
                  </div>
                ) : (
                  <div className="p-2.5 rounded-md border border-brand-hairline bg-white text-center text-xs text-brand-muted capitalize">
                    Payment status: {escrow.status}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chronological Activity Feed Panel */}
          <div className="flex-1 min-h-[300px]">
            <h3 className="text-xs font-semibold text-brand-ink uppercase tracking-wider mb-3">Workspace Activity Feed</h3>
            <WorkflowActivityFeed activities={activities} />
          </div>
        </div>

      </div>

      {/* Role-Aware Task Creation Dialog */}
      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]" onClick={() => setIsCreateTaskModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 z-10">
            <h3 className="text-lg font-semibold text-brand-ink">Create New Task</h3>
            <p className="text-xs text-brand-muted">
              {profile.role === "student" 
                ? "Define a new execution task for your project queue." 
                : "Define a review, feedback or milestone task for the student."}
            </p>
            
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-ink">Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="E.g., Design logo assets"
                  className="w-full rounded-md border border-brand-hairline px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-ink">Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what needs to be done..."
                  className="w-full rounded-md border border-brand-hairline p-3 text-sm resize-none focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-ink">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-brand-hairline bg-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-ink">Task Type</label>
                  <select
                    value={createTaskType}
                    onChange={(e) => setCreateTaskType(e.target.value as any)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-brand-hairline bg-white focus:outline-none focus:border-brand-primary"
                  >
                    {profile.role === "student" ? (
                      <>
                        <option value="execution">Execution (General)</option>
                        <option value="deliverable">Execution (Deliverable)</option>
                      </>
                    ) : (
                      <>
                        <option value="revision">Revision Request</option>
                        <option value="feedback">Feedback</option>
                        <option value="milestone">Milestone Task</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-ink">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full rounded-md border border-brand-hairline px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="px-4 py-2 border border-brand-hairline rounded-md text-sm font-medium hover:bg-brand-surface-soft transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-brand-ink text-white rounded-md text-sm font-semibold hover:bg-brand-primary-active transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Submit Milestone for Review Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]" onClick={() => setIsSubmitModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 z-10">
            <h3 className="text-lg font-semibold text-brand-ink">Submit Milestone for Review</h3>
            <p className="text-xs text-brand-muted">Provide a description of your work, links to deliverables, and notes for the client.</p>
            <textarea
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              rows={4}
              placeholder="E.g., I have finished the tasks for this milestone. You can find the links here..."
              className="w-full rounded-md border border-brand-hairline p-3 text-sm resize-none focus:outline-none focus:border-brand-primary"
            />
            {actionError && <p className="text-xs text-brand-coral">{actionError}</p>}
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-brand-hairline rounded-md text-sm font-medium hover:bg-brand-surface-soft transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={isSubmitting}
                className="px-4 py-2 bg-brand-ink text-white rounded-md text-sm font-semibold disabled:opacity-50 hover:bg-brand-primary-active transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Milestone
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Review Milestone Submission Modal */}
      {isReviewModalOpen && activeMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]" onClick={() => setIsReviewModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 z-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-brand-ink">Review Milestone Submission</h3>
            
            <div className="bg-brand-surface-soft border border-brand-hairline rounded-lg p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Student&apos;s Submission Note</span>
              <p className="text-sm text-brand-body leading-relaxed">{activeMilestone.submissionNote || "No submission note provided."}</p>
            </div>
 
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-ink">Review Feedback / Revision Instructions</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="E.g., Please fix the color contrast on the landing page..."
                className="w-full rounded-md border border-brand-hairline p-3 text-sm resize-none focus:outline-none focus:border-brand-primary"
              />
            </div>
            
            {actionError && <p className="text-xs text-brand-coral">{actionError}</p>}
            
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-brand-hairline rounded-md text-sm font-medium hover:bg-brand-surface-soft transition-colors text-center"
              >
                Cancel
              </button>
              
              <div className="flex gap-2.5">
                <button
                  onClick={handleRequestRevision}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-brand-coral text-brand-coral hover:bg-brand-coral/5 rounded-md text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  Request Revision
                </button>
                <button
                  onClick={handleApproveProject}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-success text-white rounded-md text-sm font-semibold disabled:opacity-50 hover:bg-brand-success/90 transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Approve Milestone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {/* Business Review Modal */}
      <BusinessReviewModal
        isOpen={isBusinessReviewOpen}
        onClose={() => setIsBusinessReviewOpen(false)}
        workflowId={workflow.workflowId}
        studentName={workflow.studentName}
        businessId={workflow.businessId}
        onSuccess={() => setHasSubmittedReview(true)}
      />
 
      {/* Student Review Modal */}
      <StudentReviewModal
        isOpen={isStudentReviewOpen}
        onClose={() => setIsStudentReviewOpen(false)}
        workflowId={workflow.workflowId}
        businessName={workflow.businessName}
        studentId={workflow.studentId}
        onSuccess={() => setHasSubmittedReview(true)}
      />
    </div>
  );
}
