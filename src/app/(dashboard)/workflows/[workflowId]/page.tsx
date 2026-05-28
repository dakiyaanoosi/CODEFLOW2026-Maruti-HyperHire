"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { workflowService } from "@/lib/workflow-service";
import { collaborationService } from "@/lib/collaboration-service";
import { aiWorkflowService } from "@/lib/ai-workflow-service";
import { escrowService } from "@/lib/escrow-service";
import { milestoneService } from "@/lib/milestone-service";
import { deliverableService } from "@/lib/deliverable-service";
import { messageService } from "@/lib/message-service";
import { Milestone } from "@/types/milestone";
import { Workflow, WorkflowColumn, WorkflowTask, WorkflowActivity } from "@/types/workflow";
import { Collaboration } from "@/types/collaboration";
import { Escrow } from "@/types/escrow";
import { Deliverable } from "@/types/deliverable";
import { Message } from "@/types/message";
import { CollaborationCommunicationPanel } from "@/components/messages/CollaborationCommunicationPanel";
import { WorkflowTaskDetail } from "@/components/workflows/WorkflowTaskDetail";
import { Loader2, ArrowLeft, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { reviewService } from "@/lib/review-service";
import { BusinessReviewModal } from "@/components/reviews/BusinessReviewModal";
import { StudentReviewModal } from "@/components/reviews/StudentReviewModal";

// Import restructured workspace components
import { CollaborationOverviewHeader } from "@/components/workflows/CollaborationOverviewHeader";
import { ExecutionWorkspace } from "@/components/workflows/ExecutionWorkspace";
import { ReviewWorkspace } from "@/components/workflows/ReviewWorkspace";
import { FinancialWorkspace } from "@/components/workflows/FinancialWorkspace";
import { CollaborationTimeline } from "@/components/workflows/CollaborationTimeline";

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
  const [deliverables, setDeliverables] = React.useState<Deliverable[]>([]);
  const [escrow, setEscrow] = React.useState<Escrow | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [rightSidebarTab, setRightSidebarTab] = React.useState<"chat" | "ledger">("chat");
  const [expandedDeliverableId, setExpandedDeliverableId] = React.useState<string | null>(null);

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

  // Task drawer overlay details
  const [selectedTask, setSelectedTask] = React.useState<WorkflowTask | null>(null);

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
    let unSubMessages: (() => void) | undefined;

    collaborationService.getCollaborationByWorkflowId(workflowId).then((collab) => {
      if (collab) {
        setCollaboration(collab);
        unSubCollab = collaborationService.subscribeToCollaboration(
          collab.collaborationId,
          setCollaboration
        );

        if (collab.conversationId) {
          unSubMessages = messageService.subscribeToMessages(
            collab.conversationId,
            setMessages
          );
        }

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
      if (unSubMessages) unSubMessages();
    };
  }, [workflowId, router, user, profile]);

  // Subscribe to deliverables of the active milestone
  React.useEffect(() => {
    if (!activeMilestoneId) {
      const timer = setTimeout(() => {
        setDeliverables([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    const unsub = deliverableService.subscribeToMilestoneDeliverables(activeMilestoneId, setDeliverables);
    return () => unsub();
  }, [activeMilestoneId]);

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
      // Create a milestone-level deliverable entry in database
      const collabId = collaboration?.collaborationId || `wf_${workflowId}`;
      await deliverableService.submitDeliverable({
        collaborationId: collabId,
        milestoneId: activeMilestoneId,
        submittedBy: user.uid,
        title: `Deliverables submission for Milestone ${milestones.findIndex(m => m.milestoneId === activeMilestoneId) + 1}`,
        description: submitNote.trim(),
        files: [],
      });

      setIsSubmitModalOpen(false);
      setSubmitNote("");
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setActionError(err.message || "Failed to submit milestone.");
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
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setActionError(err.message || "Failed to request milestone revision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveProject = async () => {
    if (!activeMilestoneId || !user || !profile) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await milestoneService.approveMilestone(activeMilestoneId, reviewNote.trim() || "Milestone approved.", user.uid);
      setIsReviewModalOpen(false);
      setReviewNote("");
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setActionError(err.message || "Failed to approve milestone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!escrow || !collaboration || !user || !profile) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await escrowService.releaseEscrow(escrow.escrowId, user.uid, profile.role as "student" | "business");
      setIsBusinessReviewOpen(true);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setActionError(err.message || "Failed to release escrow payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!workflow || !profile) return;
    setIsAnalyzing(true);
    
    let milestoneDeliverables: Deliverable[] = [];
    if (activeMilestoneId) {
      try {
        milestoneDeliverables = await deliverableService.getDeliverablesByMilestone(activeMilestoneId);
      } catch (err) {
        console.error("Error loading deliverables for AI analysis:", err);
      }
    }
    
    const result = await aiWorkflowService.analyzeWorkflow(
      workflow.jobTitle,
      "Application requirements context.", 
      tasks,
      profile.role as "student" | "business",
      milestoneDeliverables,
      escrow?.status,
      collabStatus,
      escrow?.updatedAt,
      escrow?.releaseEligibleAt,
      messages
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
      milestoneId: activeMilestoneId || undefined,
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
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      alert(error.message || "Failed to create task.");
    }
  };

  // ─── Direct Task Start and Deliverable-level Review Handlers ──────────────────

  const handleStartTask = async (taskId: string) => {
    if (!user || !profile || !workflow) return;
    try {
      const targetCol = columns.find((c) => c.name === "Execution Work");
      const updates: Partial<WorkflowTask> = { status: "in_progress" };
      if (targetCol) {
        updates.columnId = targetCol.columnId;
      }
      await workflowService.updateTask(taskId, updates, user.uid, profile.role as "student" | "business");
      await workflowService.logActivity({
        workflowId: workflow.workflowId,
        taskId,
        type: "task_moved",
        message: `started work on execution task`,
        actorId: user.uid,
        actorName,
        studentId: workflow.studentId,
        businessId: workflow.businessId,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      alert(error.message || "Failed to start task.");
    }
  };

  const handleApproveDeliverable = async (deliverableId: string) => {
    if (!user || !profile || !workflow) return;
    setIsSubmitting(true);
    try {
      await deliverableService.reviewDeliverable(
        deliverableId,
        user.uid,
        actorName,
        profile.role as "student" | "business",
        "approved",
        "Deliverables approved, task completed."
      );
      await workflowService.logActivity({
        workflowId: workflow.workflowId,
        type: "task_completed",
        message: `approved task deliverable`,
        actorId: user.uid,
        actorName,
        studentId: workflow.studentId,
        businessId: workflow.businessId,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      alert(error.message || "Failed to approve deliverable.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevisionDeliverable = async (deliverableId: string, feedback: string) => {
    if (!user || !profile || !workflow) return;
    setIsSubmitting(true);
    try {
      await deliverableService.reviewDeliverable(
        deliverableId,
        user.uid,
        actorName,
        profile.role as "student" | "business",
        "revision_requested",
        feedback
      );
      await workflowService.logActivity({
        workflowId: workflow.workflowId,
        type: "task_moved",
        message: `requested revision feedback on deliverable`,
        actorId: user.uid,
        actorName,
        studentId: workflow.studentId,
        businessId: workflow.businessId,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      alert(error.message || "Failed to request revision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCommentDeliverable = async (deliverableId: string, text: string) => {
    if (!user || !profile) return;
    try {
      await deliverableService.addComment(
        deliverableId,
        user.uid,
        actorName,
        profile.role as "student" | "business",
        text
      );
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      alert(error.message || "Failed to add comment.");
    }
  };

  const handleOpenDisputeEscrow = async (reason: string) => {
    if (!escrow || !user || !profile || !workflow) return;
    setIsSubmitting(true);
    try {
      const { openDispute } = await import("@/lib/escrow-service");
      await openDispute(escrow.escrowId, reason, user.uid, profile.role as "student" | "business");
      await workflowService.logActivity({
        workflowId: workflow.workflowId,
        type: "task_moved",
        message: `raised a formal dispute on contract payment: ${reason}`,
        actorId: user.uid,
        actorName,
        studentId: workflow.studentId,
        businessId: workflow.businessId,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      alert(error.message || "Failed to open dispute.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateToContext = React.useCallback((contextType: string, contextId: string) => {
    if (contextType === "task") {
      const task = tasks.find((t) => t.taskId === contextId);
      if (task) {
        setSelectedTask(task);
      }
    } else if (contextType === "milestone") {
      const ms = milestones.find((m) => m.milestoneId === contextId);
      if (ms) {
        setActiveMilestoneId(ms.milestoneId);
      }
    } else if (contextType === "deliverable") {
      const del = deliverables.find((d) => d.deliverableId === contextId);
      if (del) {
        if (del.milestoneId) {
          setActiveMilestoneId(del.milestoneId);
        }
        setExpandedDeliverableId(del.deliverableId);
      }
    } else if (contextType === "escrow") {
      setRightSidebarTab("ledger");
    }
  }, [tasks, milestones, deliverables]);

  const handleSendContextMessage = React.useCallback(async (
    content: string,
    contextType: "task" | "deliverable" | "milestone" | "escrow" | "general" | "review",
    contextId: string
  ) => {
    if (!collaboration?.conversationId || !user || !profile) return;
    await messageService.sendMessage(
      collaboration.conversationId,
      user.uid,
      profile.role as "student" | "business",
      content,
      undefined,
      undefined,
      contextType,
      contextId,
      undefined,
      false,
      collaboration.collaborationId
    );
  }, [collaboration, user, profile]);

  if (!user || !profile || isLoading || !workflow) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  // ─── Derive display state from collaboration ─────────────────────────────────

  const collabStatus = collaboration?.status || "active";
  const activeMilestone = milestones.find(m => m.milestoneId === activeMilestoneId);

  // Calculate Progress (Dynamic based on completed tasks)
  const completedTasks = tasks.filter(t => t.status === "approved" || columns.find(c => c.columnId === t.columnId)?.name === "Completed Work").length;
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4 overflow-y-auto dashboard-layout">
      {/* Back and AI control header */}
      <div className="flex items-center justify-between border-b border-brand-hairline pb-2.5">
        <Link href="/workflows" className="flex items-center gap-2 p-2 -ml-2 rounded-md hover:bg-brand-surface-soft text-brand-muted hover:text-brand-ink transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspaces</span>
        </Link>

        <button 
          onClick={handleRunAiAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-primary-active rounded-[8px] text-xs font-medium transition-colors disabled:opacity-70 cursor-pointer shadow-sm"
        >
          {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
          Run HyperAI Project Analysis
        </button>
      </div>

      {/* Structured Collaboration Overview Header */}
      <CollaborationOverviewHeader
        collaboration={collaboration}
        activeMilestone={activeMilestone || null}
        escrow={escrow}
        progressPercent={progressPercent}
        isBusiness={isBusiness}
        hasSubmittedReview={hasSubmittedReview}
        onLeaveReviewTrigger={() => {
          if (isBusiness) setIsBusinessReviewOpen(true);
          else setIsStudentReviewOpen(true);
        }}
        onFundEscrowTrigger={() => {
          router.push("/escrow");
        }}
        onReleaseEscrowTrigger={handleReleaseEscrow}
      />

      <AnimatePresence>
        {aiInsight && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline p-4 flex gap-4 items-start animate-in fade-in"
          >
            <div className="bg-white p-2 rounded-md border border-brand-hairline shrink-0">
              <BrainCircuit className="w-5 h-5 text-brand-secondary" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-brand-ink flex items-center gap-2">
                HyperAI Project Analysis
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border",
                  aiInsight.risk === "High" ? "bg-brand-warning/10 text-brand-warning border-brand-warning/20" : 
                  aiInsight.risk === "Medium" ? "bg-brand-mustard/10 text-brand-mustard border-brand-mustard/20" : "bg-brand-success/10 text-brand-success border-brand-success/20"
                )}>
                  Risk Level: {aiInsight.risk}
                </span>
              </h4>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">{aiInsight.summary}</p>
              <div className="mt-2 text-xs font-medium text-brand-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
                {aiInsight.insight}
              </div>
            </div>
            <button 
              onClick={() => setAiInsight(null)}
              className="text-brand-muted hover:text-brand-ink p-1 cursor-pointer text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────── THREE COLUMN RESPONSIVE GRID ────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Left Column: Milestone Progression Navigator */}
        <div className="lg:col-span-1 flex flex-col space-y-3.5 overflow-y-auto pr-1">
          <h3 className="text-xs font-semibold text-brand-ink uppercase tracking-wider mb-1">Milestone Phases</h3>
          <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-3.5 lg:pb-0 scrollbar-thin">
            {milestones.map((m) => {
              const isActive = m.milestoneId === activeMilestoneId;
              return (
                <button
                  key={m.milestoneId}
                  onClick={() => setActiveMilestoneId(m.milestoneId)}
                  className={cn(
                    "flex flex-col text-left p-4 rounded-xl border min-w-[200px] lg:min-w-0 transition-all cursor-pointer",
                    isActive 
                      ? "bg-white border-brand-ink shadow-sm ring-1 ring-brand-ink/5"
                      : "bg-brand-surface-soft/40 border-brand-hairline hover:bg-brand-surface-soft"
                  )}
                >
                  <div className="flex justify-between items-start w-full gap-2 mb-1.5">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">Phase {m.order + 1}</span>
                    <span className={cn(
                      "text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border",
                      m.status === "approved" ? "bg-brand-success/15 text-brand-success border-brand-success/20" :
                      m.status === "in_review" ? "bg-brand-info/10 text-brand-info border-brand-info/20" :
                      m.status === "revision_requested" ? "bg-brand-coral/10 text-brand-coral border-brand-coral/20" :
                      m.status === "active" ? "bg-brand-primary/10 text-brand-primary border-brand-hairline" :
                      "bg-brand-surface-strong text-brand-muted border-brand-hairline"
                    )}>
                      {m.status.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-brand-ink truncate w-full mb-2">{m.title}</h4>
                  
                  {/* Progress bar */}
                  <div className="w-full mt-auto">
                    <div className="flex justify-between items-center text-[9px] text-brand-muted font-medium mb-1">
                      <span>Completion</span>
                      <span>{m.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-brand-surface-strong rounded-full overflow-hidden border border-brand-hairline/80">
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
        </div>

        {/* Center Workspace (Main execution & review containers) */}
        <div className="lg:col-span-2 flex flex-col space-y-6 overflow-y-auto pr-1">
          {/* Execution Workspace Card */}
          <ExecutionWorkspace
            workflow={workflow}
            activeMilestone={activeMilestone || null}
            tasks={tasks.filter(t => {
              if (!t.milestoneId) {
                return activeMilestoneId === milestones[0]?.milestoneId;
              }
              return t.milestoneId === activeMilestoneId;
            })}
            actorRole={profile.role as "student" | "business"}
            collaborationStatus={collabStatus}
            onAddTaskClick={(type) => {
              setCreateTaskType(type);
              setIsCreateTaskModalOpen(true);
            }}
            onTaskClick={setSelectedTask}
            onStartTask={handleStartTask}
            onSubmitWorkClick={setSelectedTask}
          />

          {/* Dedicated Deliverables Review & Submission Center */}
          <ReviewWorkspace
            workflow={workflow}
            activeMilestone={activeMilestone || null}
            deliverables={deliverables}
            actorRole={profile.role as "student" | "business"}
            isSubmitting={isSubmitting}
            onApproveDeliverable={handleApproveDeliverable}
            onRequestRevision={handleRequestRevisionDeliverable}
            onAddComment={handleAddCommentDeliverable}
            onSubmitDeliverableClick={() => {
              setActionError(null);
              setIsSubmitModalOpen(true);
            }}
            messages={messages}
            expandedDeliverableId={expandedDeliverableId}
          />
        </div>

        {/* Right Sidebar: Trust Ledger, Workspace Timeline & Operational Chat */}
        <div className="lg:col-span-1 flex flex-col space-y-4 overflow-y-auto pr-1">
          {/* Tab selector for Right Sidebar */}
          <div className="flex bg-brand-surface-soft/40 p-1 rounded-lg border border-brand-hairline shrink-0">
            <button
              onClick={() => setRightSidebarTab("chat")}
              className={cn(
                "flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-all cursor-pointer",
                rightSidebarTab === "chat"
                  ? "bg-white text-brand-ink shadow-sm"
                  : "text-brand-muted hover:text-brand-ink"
              )}
            >
              Workspace Chat
            </button>
            <button
              onClick={() => setRightSidebarTab("ledger")}
              className={cn(
                "flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-all cursor-pointer",
                rightSidebarTab === "ledger"
                  ? "bg-white text-brand-ink shadow-sm"
                  : "text-brand-muted hover:text-brand-ink"
              )}
            >
              Finance & Audit
            </button>
          </div>

          {rightSidebarTab === "chat" ? (
            collaboration && (
              <CollaborationCommunicationPanel
                collaboration={collaboration}
                messages={messages}
                currentUserId={user.uid}
                currentUserRole={profile.role as "student" | "business"}
                onSendMessage={async (content, attachmentUrl, attachmentType, contextType, contextId) => {
                  if (!collaboration?.conversationId || !profile) return;
                  await messageService.sendMessage(
                    collaboration.conversationId,
                    user.uid,
                    profile.role as "student" | "business",
                    content,
                    attachmentUrl,
                    attachmentType,
                    contextType,
                    contextId,
                    undefined,
                    false,
                    collaboration.collaborationId
                  );
                }}
                onNavigateToContext={handleNavigateToContext}
                tasks={tasks}
                deliverables={deliverables}
                milestones={milestones}
                escrow={escrow}
              />
            )
          ) : (
            <div className="space-y-6 flex flex-col">
              <FinancialWorkspace
                escrow={escrow}
                milestones={milestones}
                isBusiness={isBusiness}
                isSubmitting={isSubmitting}
                onFundEscrow={async () => {
                  router.push("/escrow");
                }}
                onReleaseEscrow={handleReleaseEscrow}
                onOpenDispute={handleOpenDisputeEscrow}
              />

              <CollaborationTimeline activities={activities} />
            </div>
          )}
        </div>

      </div>

      {/* Task Drawer Overlay */}
      <WorkflowTaskDetail
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        actorId={user.uid}
        actorRole={profile.role as "student" | "business"}
        actorName={actorName}
        workflow={workflow}
        columns={columns}
        messages={messages}
        onSendContextMessage={handleSendContextMessage}
      />

      {/* Role-Aware Task Creation Dialog */}
      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]" onClick={() => setIsCreateTaskModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 z-10 border border-brand-hairline">
            <h3 className="text-base font-semibold text-brand-ink">Create New Task</h3>
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
                    onChange={(e) => setTaskPriority(e.target.value as "Low" | "Medium" | "High")}
                    className="w-full h-10 px-3 text-sm rounded-md border border-brand-hairline bg-white focus:outline-none focus:border-brand-primary cursor-pointer"
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
                    onChange={(e) => setCreateTaskType(e.target.value as WorkflowTask["taskType"])}
                    className="w-full h-10 px-3 text-sm rounded-md border border-brand-hairline bg-white focus:outline-none focus:border-brand-primary cursor-pointer"
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
                className="px-4 py-2 border border-brand-hairline rounded-md text-sm font-medium hover:bg-brand-surface-soft transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-brand-ink text-white rounded-md text-sm font-semibold hover:bg-brand-primary-active transition-colors cursor-pointer"
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
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 z-10 border border-brand-hairline">
            <h3 className="text-base font-semibold text-brand-ink">Submit Milestone for Review</h3>
            <p className="text-xs text-brand-muted">Provide a description of your work, links to deliverables, and notes for the client.</p>
            <textarea
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              rows={4}
              placeholder="E.g., I have finished the tasks for this milestone. You can find the links here..."
              className="w-full rounded-md border border-brand-hairline p-3 text-sm resize-none focus:outline-none focus:border-brand-primary bg-white text-brand-ink"
            />
            {actionError && <p className="text-xs text-brand-coral">{actionError}</p>}
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-brand-hairline rounded-md text-sm font-medium hover:bg-brand-surface-soft transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={isSubmitting}
                className="px-4 py-2 bg-brand-ink text-white rounded-md text-sm font-semibold disabled:opacity-50 hover:bg-brand-primary-active transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
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
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 z-10 max-h-[90vh] overflow-y-auto border border-brand-hairline">
            <h3 className="text-base font-semibold text-brand-ink">Review Milestone Submission</h3>
            
            <div className="bg-brand-surface-soft border border-brand-hairline rounded-lg p-4 space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-brand-muted">Student&apos;s Submission Note</span>
              <p className="text-xs text-brand-body leading-relaxed">{activeMilestone.submissionNote || "No submission note provided."}</p>
            </div>
 
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-ink">Review Feedback / Revision Instructions</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="E.g., Please fix the color contrast on the landing page..."
                className="w-full rounded-md border border-brand-hairline p-3 text-sm resize-none focus:outline-none focus:border-brand-primary bg-white text-brand-ink"
              />
            </div>
            
            {actionError && <p className="text-xs text-brand-coral">{actionError}</p>}
            
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-brand-hairline rounded-md text-sm font-medium hover:bg-brand-surface-soft transition-colors text-center cursor-pointer"
              >
                Cancel
              </button>
              
              <div className="flex gap-2.5">
                <button
                  onClick={handleRequestRevision}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-brand-coral text-brand-coral hover:bg-brand-coral/5 rounded-md text-sm font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Request Revision
                </button>
                <button
                  onClick={handleApproveProject}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-success text-white rounded-md text-sm font-semibold disabled:opacity-50 hover:bg-brand-success/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
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
