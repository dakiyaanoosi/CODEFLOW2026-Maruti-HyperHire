"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { workflowService } from "@/lib/workflow-service";
import { aiWorkflowService } from "@/lib/ai-workflow-service";
import { escrowService } from "@/lib/escrow-service";
import { Workflow, WorkflowColumn, WorkflowTask, WorkflowActivity } from "@/types/workflow";
import { Escrow } from "@/types/escrow";
import { WorkflowBoard } from "@/components/workflows/WorkflowBoard";
import { Loader2, ArrowLeft, BrainCircuit, CheckCircle2, Send, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkspacePage({ params }: { params: Promise<{ workflowId: string }> }) {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const unwrappedParams = React.use(params);
  const workflowId = unwrappedParams.workflowId;

  const [workflow, setWorkflow] = React.useState<Workflow | null>(null);
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
    };
  }, [workflowId, router, user, profile]);

  const handleRunAiAnalysis = async () => {
    if (!workflow) return;
    setIsAnalyzing(true);
    
    const result = await aiWorkflowService.analyzeWorkflow(
      workflow.jobTitle,
      "Application requirements context.", 
      tasks
    );

    setAiInsight({
      summary: result.summary,
      insight: result.productivity_insight,
      risk: result.risk_level
    });
    setIsAnalyzing(false);
  };

  const handleSubmitWork = async () => {
    if (!escrow) return;
    if (!submitNote.trim()) {
      setActionError("Please describe what you are delivering.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      await escrowService.submitWork(escrow.escrowId, submitNote.trim());
      setIsSubmitModalOpen(false);
      setSubmitNote("");
      // Force update workflow status in state
      setWorkflow((prev) => (prev ? { ...prev, status: "completed" } : null));
    } catch (e: any) {
      setActionError(e.message || "Failed to submit work.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!escrow) return;
    if (!reviewNote.trim()) {
      setActionError("Please provide revision feedback instructions.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      await escrowService.requestRevision(escrow.escrowId, reviewNote.trim());
      setIsReviewModalOpen(false);
      setReviewNote("");
      // Force update workflow status in state
      setWorkflow((prev) => (prev ? { ...prev, status: "Revision" } : null));
    } catch (e: any) {
      setActionError(e.message || "Failed to request revision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!escrow) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await escrowService.releaseEscrow(escrow.escrowId);
      setIsReviewModalOpen(false);
      // Force update workflow status in state
      setWorkflow((prev) => (prev ? { ...prev, status: "Paid" } : null));
    } catch (e: any) {
      setActionError(e.message || "Failed to release escrow.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !profile || isLoading || !workflow) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  // Calculate Progress (Dynamic based on completed tasks)
  const completedTasks = tasks.filter(t => t.status === "completed" || columns.find(c => c.columnId === t.columnId)?.name === "Completed").length;
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
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
                workflow.status === "Paid" || workflow.status === "Completed" || workflow.status === "completed" 
                  ? "bg-brand-success/10 text-brand-success" 
                  : workflow.status === "Revision" 
                  ? "bg-brand-warning/10 text-brand-warning text-brand-mustard" 
                  : "bg-brand-surface-strong text-brand-ink"
              )}>
                {workflow.status}
              </span>
            </div>
            <p className="text-sm text-brand-muted mt-0.5">
              Collaboration between <span className="font-medium text-brand-ink">{workflow.businessName}</span> and <span className="font-medium text-brand-ink">{workflow.studentName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-32 h-2 bg-brand-surface-soft rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-primary transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <span className="text-xs font-semibold text-brand-ink">{progressPercent}%</span>
          </div>

          <button 
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3.5 py-2 bg-brand-secondary text-white rounded-[8px] text-sm font-semibold hover:bg-brand-secondary/90 transition-colors disabled:opacity-70"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            AI Analyze
          </button>

          {/* Student Escrow Action */}
          {!isBusiness && escrow && (escrow.status === "funded" || escrow.status === "revision_requested") && (
            <button
              onClick={() => {
                setActionError(null);
                setIsSubmitModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-brand-ink text-white rounded-[8px] text-sm font-semibold hover:bg-brand-primary-active transition-colors"
            >
              <Send className="w-4 h-4" />
              Submit Project for Review
            </button>
          )}

          {/* Business Escrow Action */}
          {isBusiness && escrow && escrow.status === "completed" && (
            <button
              onClick={() => {
                setActionError(null);
                setIsReviewModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-brand-success text-white rounded-[8px] text-sm font-semibold hover:bg-brand-success/90 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Review Deliverable
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {aiInsight && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline p-4 flex gap-4 items-start"
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

      {/* Main Board Area */}
      <div className="flex-1 mt-4 -mx-4 px-4 overflow-hidden">
        <WorkflowBoard 
          workflow={workflow}
          columns={columns}
          tasks={tasks}
          activities={activities}
          actorId={user.uid}
          actorName={actorName}
        />
      </div>

      {/* Submit Project for Review Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]" onClick={() => setIsSubmitModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 z-10">
            <h3 className="text-lg font-semibold text-brand-ink">Submit Project for Review</h3>
            <p className="text-xs text-brand-muted">Provide a description of your work, links to deliverables, and notes for the client.</p>
            <textarea
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              rows={4}
              placeholder="E.g., I have finished the landing page redesign. You can find the live preview link here..."
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
                Submit Deliverable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Deliverable Modal */}
      {isReviewModalOpen && escrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]" onClick={() => setIsReviewModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 z-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-brand-ink">Review Student Deliverable</h3>
            
            <div className="bg-brand-surface-soft border border-brand-hairline rounded-lg p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Student's Submission Note</span>
              <p className="text-sm text-brand-body leading-relaxed">{escrow.submissionNote || "No submission note provided."}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-ink">Review Feedback / Revision Instructions</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="Required only for Revision requests. E.g., Please fix the color contrast on the login button..."
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
                  onClick={handleReleaseEscrow}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-success text-white rounded-md text-sm font-semibold disabled:opacity-50 hover:bg-brand-success/90 transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Approve & Release Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
