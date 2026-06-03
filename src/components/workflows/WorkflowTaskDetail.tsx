"use client";

import * as React from "react";
import { Workflow, WorkflowTask, WorkflowColumn } from "@/types/workflow";
import { workflowService } from "@/lib/workflow-service";
import { uploadFile } from "@/lib/cloudinary";
import {
  X,
  Paperclip,
  Loader2,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Trash2,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { deliverableService } from "@/lib/deliverable-service";
import { Deliverable } from "@/types/deliverable";
import { Timestamp } from "firebase/firestore";
import { Message } from "@/types/message";
import { MessageBubble } from "@/components/messages/MessageBubble";

interface WorkflowTaskDetailProps {
  task: WorkflowTask | null;
  isOpen: boolean;
  onClose: () => void;
  actorId: string;
  actorRole: "student" | "business";
  actorName: string;
  workflow: Workflow;
  columns: WorkflowColumn[];
  messages?: Message[];
  onSendContextMessage?: (content: string, contextType: "task" | "deliverable" | "milestone" | "escrow" | "general" | "review", contextId: string) => Promise<void>;
}

export function WorkflowTaskDetail({
  task,
  isOpen,
  onClose,
  actorId,
  actorRole,
  actorName,
  workflow,
  columns,
  messages = [],
  onSendContextMessage,
}: WorkflowTaskDetailProps) {
  const [deliverables, setDeliverables] = React.useState<Deliverable[]>([]);
  const [isSubmitOpen, setIsSubmitOpen] = React.useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // Deliverable form state
  const [delivTitle, setDelivTitle] = React.useState("");
  const [delivDesc, setDelivDesc] = React.useState("");
  const [delivFiles, setDelivFiles] = React.useState<string[]>([]);
  const [delivFileNames, setDelivFileNames] = React.useState<string[]>([]);

  // Revision state
  const [revisionFeedback, setRevisionFeedback] = React.useState("");

  // Task comment state
  const [taskComment, setTaskComment] = React.useState("");

  const taskMessages = React.useMemo(() => {
    if (!task) return [];
    return messages.filter((m) => m.contextType === "task" && m.contextId === task.taskId);
  }, [messages, task]);

  const handleSendComment = async () => {
    const text = taskComment.trim();
    if (!text || !task || !onSendContextMessage) return;
    setTaskComment("");
    try {
      await onSendContextMessage(text, "task", task.taskId);
    } catch (err) {
      console.error("Failed to send task comment:", err);
      alert("Failed to send task comment.");
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Subscribe to deliverables for this task
  React.useEffect(() => {
    if (!isOpen || !task) {
      return;
    }
    const unsub = deliverableService.subscribeToDeliverables(task.taskId, setDeliverables);
    return () => {
      unsub();
      setDeliverables([]);
    };
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const currentColumn = columns.find((c) => c.columnId === task.columnId);
  const latestDeliverable = deliverables.length > 0 ? deliverables[deliverables.length - 1] : null;

  // File Upload for Deliverable Submission
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await uploadFile(file, setUploadProgress);
      setDelivFiles((prev) => [...prev, result.url]);
      setDelivFileNames((prev) => [...prev, file.name || "Attachment"]);
    } catch (err) {
      const error = err as Error;
      console.error("Upload failed", error);
      alert(error.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeUploadedFile = (idx: number) => {
    setDelivFiles((prev) => prev.filter((_, i) => i !== idx));
    setDelivFileNames((prev) => prev.filter((_, i) => i !== idx));
  };

  // Start task work: transitions status pending -> in_progress
  const handleStartTask = async () => {
    try {
      const targetCol = columns.find((c) => c.name === "Execution Work");
      const updates: Partial<WorkflowTask> = { status: "in_progress" };
      if (targetCol) {
        updates.columnId = targetCol.columnId;
      }

      await workflowService.updateTask(task.taskId, updates, actorId, actorRole);
      await workflowService.logActivity({
        workflowId: workflow.workflowId,
        taskId: task.taskId,
        type: "task_moved",
        message: `started work on execution task "${task.title}"`,
        actorId,
        actorName,
        studentId: workflow.studentId,
        businessId: workflow.businessId,
      });
    } catch (err) {
      const error = err as Error;
      alert(error.message || "Failed to start task.");
    }
  };

  // Submit Deliverable Submission
  const handleDeliverableSubmit = async () => {
    if (!delivTitle.trim()) {
      alert("Please enter a deliverable title.");
      return;
    }

    try {
      setIsUploading(true);

      const collabId = workflow.collaborationId || `wf_${workflow.workflowId}`;
      const deliv = await deliverableService.submitDeliverable({
        collaborationId: collabId,
        taskId: task.taskId,
        submittedBy: actorId,
        title: delivTitle.trim(),
        description: delivDesc.trim(),
        files: delivFiles,
      });

      await workflowService.logActivity({
        workflowId: workflow.workflowId,
        taskId: task.taskId,
        type: "task_moved",
        message: `submitted deliverable v${deliv.version} for task "${task.title}"`,
        actorId,
        actorName,
        studentId: workflow.studentId,
        businessId: workflow.businessId,
      });

      // Clear states
      setDelivTitle("");
      setDelivDesc("");
      setDelivFiles([]);
      setDelivFileNames([]);
      setIsSubmitOpen(false);
    } catch (err) {
      const error = err as Error;
      alert(error.message || "Failed to submit deliverable.");
    } finally {
      setIsUploading(false);
    }
  };

  // Review: Approve Deliverable
  const handleApproveTask = async () => {
    if (!latestDeliverable) return;

    try {
      setIsUploading(true);

      await deliverableService.reviewDeliverable(
        latestDeliverable.deliverableId,
        actorId,
        actorName,
        actorRole,
        "approved",
        "Deliverables approved, task completed."
      );

      await workflowService.logActivity({
        workflowId: workflow.workflowId,
        taskId: task.taskId,
        type: "task_completed",
        message: `approved deliverable v${latestDeliverable.version} for task "${task.title}"`,
        actorId,
        actorName,
        studentId: workflow.studentId,
        businessId: workflow.businessId,
      });
    } catch (err) {
      const error = err as Error;
      alert(error.message || "Failed to approve deliverable.");
    } finally {
      setIsUploading(false);
    }
  };

  // Review: Request Revision
  const handleRequestRevision = async () => {
    if (!latestDeliverable) return;
    if (!revisionFeedback.trim()) {
      alert("Please provide revision feedback instructions.");
      return;
    }

    try {
      setIsUploading(true);

      await deliverableService.reviewDeliverable(
        latestDeliverable.deliverableId,
        actorId,
        actorName,
        actorRole,
        "revision_requested",
        revisionFeedback.trim()
      );

      await workflowService.logActivity({
        workflowId: workflow.workflowId,
        taskId: task.taskId,
        type: "task_moved",
        message: `requested revision on v${latestDeliverable.version} for task "${task.title}"`,
        actorId,
        actorName,
        studentId: workflow.studentId,
        businessId: workflow.businessId,
      });

      setRevisionFeedback("");
      setIsRevisionOpen(false);
    } catch (err) {
      const error = err as Error;
      alert(error.message || "Failed to request revision.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-brand-ink/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-[550px] h-full bg-white shadow-2xl border-l border-brand-hairline flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-hairline bg-brand-surface-soft/20">
            <div>
              <h2 className="text-lg font-semibold text-brand-ink truncate">Execution Detail Center</h2>
              <p className="text-xs text-brand-muted mt-0.5">Role-aware work lifecycle & deliverables</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-brand-muted hover:bg-brand-surface-soft hover:text-brand-ink transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {/* Title & Description */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    task.priority === "High"
                      ? "bg-[#aa2d00]/10 text-[#aa2d00]"
                      : task.priority === "Medium"
                      ? "bg-[#d9a441]/10 text-[#8a6200]"
                      : "bg-brand-surface-strong text-brand-muted"
                  )}
                >
                  {task.priority} Priority
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  {task.taskType}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-surface-soft text-brand-ink border border-brand-hairline">
                  {currentColumn?.name || "Execution Stage"}
                </span>
              </div>
              <h1 className="text-xl font-bold text-brand-ink leading-[1.3] mb-3">{task.title}</h1>
              <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>

            {/* Task Ownership System Details */}
            <div className="p-4 rounded-xl border border-brand-hairline bg-brand-surface-soft/20 space-y-3.5">
              <h4 className="text-xs font-semibold text-brand-ink uppercase tracking-wide">Work Ownership Profile</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-brand-muted block font-medium">Task Requester (Owner)</span>
                  <span className="font-semibold text-brand-ink">
                    {task.ownerRole === "student" ? workflow.studentName : workflow.businessName}{" "}
                    <span className="text-[10px] text-brand-muted capitalize">({task.ownerRole})</span>
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-brand-muted block font-medium">Task Executor (Assignee)</span>
                  <span className="font-semibold text-brand-ink">
                    {task.assignedRole === "student" ? workflow.studentName : workflow.businessName}{" "}
                    <span className="text-[10px] text-brand-muted capitalize">({task.assignedRole})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* AI Suggestions Block */}
            {task.aiSuggestions && task.aiSuggestions.length > 0 && (
              <div className="rounded-xl border border-brand-secondary/20 bg-brand-secondary/5 p-4">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-brand-secondary mb-2.5 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  HyperAI Suggestions
                </h4>
                <ul className="space-y-2">
                  {task.aiSuggestions.map((sug, i) => (
                    <li key={i} className="text-xs text-brand-ink flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5 shrink-0" />
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Execution Controls Action Center */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-brand-ink uppercase tracking-wide">Operational Transition Center</h4>
              
              <div className="flex flex-wrap gap-3">
                {/* Student Start Work (Pending -> In Progress) */}
                {actorRole === "student" && task.status === "pending" && (
                  <button
                    onClick={handleStartTask}
                    className="w-full h-10 bg-brand-ink text-white rounded-lg text-sm font-semibold hover:bg-brand-primary transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Clock className="w-4 h-4" />
                    Start Execution Work
                  </button>
                )}

                {/* Student Submit Deliverable Form Trigger */}
                {actorRole === "student" && (task.status === "in_progress" || task.status === "revision_requested") && !isSubmitOpen && (
                  <button
                    onClick={() => {
                      setIsSubmitOpen(true);
                      setIsRevisionOpen(false);
                    }}
                    className="w-full h-10 bg-brand-ink text-white rounded-lg text-sm font-semibold hover:bg-brand-primary transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Paperclip className="w-4 h-4" />
                    Submit Deliverable & Artifacts
                  </button>
                )}

                {/* Business Reviews Deliverable Action Buttons */}
                {actorRole === "business" && task.status === "submitted" && latestDeliverable && !isRevisionOpen && (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={() => setIsRevisionOpen(true)}
                      className="h-10 border border-brand-warning text-brand-warning hover:bg-brand-warning/5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Request Revision
                    </button>
                    <button
                      onClick={handleApproveTask}
                      disabled={isUploading}
                      className="h-10 bg-brand-success text-white hover:bg-brand-success/90 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Deliverables
                    </button>
                  </div>
                )}

                {/* Terminal Approved State */}
                {task.status === "approved" && (
                  <div className="p-3 w-full rounded-lg border border-brand-success/20 bg-brand-success/5 text-center flex items-center justify-center gap-2 text-brand-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-semibold">Deliverable Approved & Closed</span>
                  </div>
                )}
              </div>

              {/* Deliverable Submission Form Panel */}
              {isSubmitOpen && (
                <div className="p-4 rounded-xl border border-brand-hairline bg-brand-surface-soft/40 space-y-4 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between border-b border-brand-hairline pb-2">
                    <h5 className="text-xs font-bold text-brand-ink uppercase">Submit Deliverable Form</h5>
                    <button
                      onClick={() => setIsSubmitOpen(false)}
                      className="text-xs text-brand-muted hover:text-brand-ink"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-ink uppercase">Deliverable Title</label>
                      <input
                        type="text"
                        value={delivTitle}
                        onChange={(e) => setDelivTitle(e.target.value)}
                        placeholder="E.g., Responsive landing page prototype"
                        className="w-full rounded-md border border-brand-hairline px-3 py-1.5 text-xs focus:outline-none focus:border-brand-primary bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-ink uppercase">Submission Notes / Description</label>
                      <textarea
                        value={delivDesc}
                        onChange={(e) => setDelivDesc(e.target.value)}
                        rows={2}
                        placeholder="Detail the deliverable components or links..."
                        className="w-full rounded-md border border-brand-hairline p-2.5 text-xs resize-none focus:outline-none focus:border-brand-primary bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-brand-ink uppercase">Files / Attachments</label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] font-bold text-brand-link hover:text-brand-link/85"
                        >
                          + Upload file
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileUpload}
                          accept="image/*,application/pdf"
                        />
                      </div>

                      {isUploading && (
                        <div className="flex items-center gap-2.5 p-2 rounded border border-brand-hairline bg-white">
                          <Loader2 className="w-3.5 h-3.5 text-brand-muted animate-spin" />
                          <div className="flex-1 text-[10px]">
                            <span className="font-semibold">Uploading... {uploadProgress}%</span>
                          </div>
                        </div>
                      )}

                      {delivFiles.length > 0 && (
                        <div className="space-y-1.5">
                          {delivFiles.map((f, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded bg-white border border-brand-hairline text-xs">
                              <span className="truncate max-w-[280px] font-medium text-brand-ink">{delivFileNames[idx]}</span>
                              <button
                                onClick={() => removeUploadedFile(idx)}
                                className="text-brand-coral hover:text-[#aa2d00]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleDeliverableSubmit}
                      disabled={isUploading || delivFiles.length === 0}
                      className="w-full h-8.5 bg-brand-ink hover:bg-brand-primary text-white text-xs font-semibold rounded-[6px] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Submit Work
                    </button>
                  </div>
                </div>
              )}

              {/* Revision Request Input Panel */}
              {isRevisionOpen && (
                <div className="p-4 rounded-xl border border-brand-hairline bg-brand-surface-soft/40 space-y-4 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between border-b border-brand-hairline pb-2">
                    <h5 className="text-xs font-bold text-brand-ink uppercase">Revision Feedback</h5>
                    <button
                      onClick={() => setIsRevisionOpen(false)}
                      className="text-xs text-brand-muted hover:text-brand-ink"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-ink uppercase">Actionable Feedback Description</label>
                      <textarea
                        value={revisionFeedback}
                        onChange={(e) => setRevisionFeedback(e.target.value)}
                        rows={3}
                        placeholder="Detail clearly what changes need to be made by the student..."
                        className="w-full rounded-md border border-brand-hairline p-2.5 text-xs resize-none focus:outline-none focus:border-brand-primary bg-white"
                      />
                    </div>

                    <button
                      onClick={handleRequestRevision}
                      disabled={isUploading}
                      className="w-full h-8.5 bg-brand-warning text-white text-xs font-semibold rounded-[6px] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      Send Revision Instructions
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Deliverables History Tracker */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-brand-ink uppercase tracking-wide">
                Deliverable Submissions & History
              </h4>

              {deliverables.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-brand-hairline text-center bg-brand-surface-soft/10">
                  <p className="text-xs text-brand-muted">No deliverables uploaded yet for this execution task.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Timeline progression visualizer */}
                  <div className="p-4 rounded-xl border border-brand-hairline bg-brand-surface-soft/10 space-y-3.5">
                    <h5 className="text-[11px] font-bold text-brand-ink uppercase tracking-wide">Submission & Review Timeline</h5>
                    <div className="relative pl-5 border-l-2 border-brand-hairline space-y-4 text-xs">
                      {deliverables.map((d) => {
                        const submittedDate = d.submittedAt ? (d.submittedAt instanceof Timestamp ? d.submittedAt.toDate() : new Date(d.submittedAt)) : null;
                        const reviewedDate = d.reviewedAt ? (d.reviewedAt instanceof Timestamp ? d.reviewedAt.toDate() : new Date(d.reviewedAt)) : null;
                        return (
                          <div key={d.deliverableId} className="relative">
                            {/* Dot icon */}
                            <div className={cn(
                              "absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center",
                              d.reviewStatus === "approved"
                                ? "border-brand-success text-brand-success"
                                : d.reviewStatus === "revision_requested"
                                ? "border-brand-warning text-brand-warning"
                                : "border-brand-info text-brand-info"
                            )}>
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                d.reviewStatus === "approved"
                                  ? "bg-brand-success"
                                  : d.reviewStatus === "revision_requested"
                                  ? "bg-brand-warning"
                                  : "bg-brand-info"
                              )} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-brand-ink">Version v{d.version} Submitted</span>
                                {submittedDate && (
                                  <span className="text-[10px] text-brand-muted font-mono">
                                    {submittedDate.toLocaleDateString()} {submittedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-brand-muted text-[11px] mt-0.5">{d.title}</p>
                              {d.reviewStatus !== "pending_review" && (
                                <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                                  <span className={cn(
                                    "font-semibold uppercase tracking-[0.2px]",
                                    d.reviewStatus === "approved" ? "text-brand-success" : "text-brand-warning"
                                  )}>
                                    {d.reviewStatus === "approved" ? "Approved" : "Revision Requested"}
                                  </span>
                                  {reviewedDate && (
                                    <span className="text-brand-muted">
                                      on {reviewedDate.toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* List of Deliverables with expanded notes & reviewer feedback */}
                  {deliverables.map((deliv) => {
                    const submittedDate = deliv.submittedAt ? (deliv.submittedAt instanceof Timestamp ? deliv.submittedAt.toDate() : new Date(deliv.submittedAt)) : null;
                    const reviewedDate = deliv.reviewedAt ? (deliv.reviewedAt instanceof Timestamp ? deliv.reviewedAt.toDate() : new Date(deliv.reviewedAt)) : null;

                    return (
                      <div
                        key={deliv.deliverableId}
                        className="p-4 rounded-xl border border-brand-hairline bg-white shadow-sm space-y-3 hover:border-brand-primary/45 transition-colors"
                      >
                        <div className="flex items-center justify-between border-b border-brand-hairline pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold">
                              v{deliv.version}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-brand-ink block">{deliv.title}</span>
                              {submittedDate && (
                                <span className="text-[9px] text-brand-muted font-mono block mt-0.5">
                                  Submitted: {submittedDate.toLocaleDateString()} {submittedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                              deliv.reviewStatus === "approved"
                                ? "bg-brand-success/15 text-brand-success"
                                : deliv.reviewStatus === "revision_requested"
                                ? "bg-brand-warning/15 text-brand-warning"
                                : "bg-brand-info/15 text-brand-info"
                            )}
                          >
                            {deliv.reviewStatus.replace("_", " ")}
                          </span>
                        </div>

                        {deliv.description && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-brand-ink uppercase block">Submitter Notes</span>
                            <p className="text-xs text-brand-muted leading-relaxed whitespace-pre-wrap">
                              {deliv.description}
                            </p>
                          </div>
                        )}

                        {/* Deliverable File URLs */}
                        {deliv.files && deliv.files.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-brand-ink uppercase block">Files & Artifacts</span>
                            <div className="grid grid-cols-1 gap-2">
                              {deliv.files.map((fileUrl, fIdx) => (
                                <a
                                  key={fIdx}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2.5 p-2 rounded bg-brand-surface-soft/40 border border-brand-hairline hover:bg-brand-surface-soft transition-colors group text-xs font-medium text-brand-ink"
                                >
                                  <FileText className="w-3.5 h-3.5 text-brand-muted group-hover:text-brand-primary transition-colors" />
                                  <span className="truncate max-w-[250px]">{`Attachment file ${fIdx + 1}`}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Top-Level Modern Review Feedback */}
                        {(deliv.reviewedBy || deliv.feedback) && (
                          <div className="border-t border-brand-hairline pt-2.5 mt-2 space-y-2">
                            <span className="text-[9px] font-bold text-brand-ink uppercase block">Client Review Feedback</span>
                            <div className="flex gap-2.5 text-xs items-start bg-brand-surface-soft/30 p-2.5 rounded-lg border border-brand-hairline">
                              <MessageSquare className="w-4 h-4 text-brand-muted shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-semibold text-brand-ink">
                                  {deliv.reviewedBy === workflow.businessId ? workflow.businessName : "Business Client"}{" "}
                                  <span className="text-[10px] text-brand-muted capitalize font-normal">
                                    (business)
                                  </span>
                                </p>
                                {deliv.feedback && <p className="text-brand-muted leading-relaxed whitespace-pre-wrap">{deliv.feedback}</p>}
                                {reviewedDate && (
                                  <p className="text-[9px] text-brand-muted font-mono">
                                    {reviewedDate.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Legacy Review Logs (For backward compatibility) */}
                        {deliv.reviews && deliv.reviews.length > 0 && (
                          <div className="border-t border-brand-hairline pt-2.5 mt-2 space-y-2">
                            <span className="text-[9px] font-bold text-brand-ink uppercase block">Reviewer Feedback Logs (Legacy)</span>
                            {deliv.reviews.map((rev) => (
                              <div key={rev.reviewId} className="flex gap-2.5 text-xs items-start bg-brand-surface-soft/30 p-2.5 rounded-lg border border-brand-hairline">
                                <MessageSquare className="w-4 h-4 text-brand-muted shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-brand-ink">
                                    {rev.reviewerName}{" "}
                                    <span className="text-[10px] text-brand-muted capitalize font-normal">
                                      ({rev.reviewerRole})
                                    </span>
                                  </p>
                                  {rev.feedback && <p className="text-brand-muted leading-relaxed">{rev.feedback}</p>}
                                  <p className="text-[9px] text-brand-muted">
                                    {new Date(rev.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Task Discussion Thread */}
            <div className="border-t border-brand-hairline pt-6.5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-brand-secondary" />
                <h4 className="text-xs font-semibold text-brand-ink uppercase tracking-wide">
                  Task Execution Discussion
                </h4>
              </div>

              {/* Messages list */}
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 border border-brand-hairline rounded-xl p-3 bg-brand-surface-soft/10">
                {taskMessages.length === 0 ? (
                  <p className="text-xs text-brand-muted text-center py-4">
                    No comments in this thread yet. Start the conversation!
                  </p>
                ) : (
                  taskMessages.map((msg) => {
                    const isOwn = msg.senderId === actorId;
                    const senderName = isOwn ? "You" : (msg.senderId === "system" ? "System" : (msg.senderRole === "student" ? workflow.studentName : workflow.businessName));
                    return (
                      <MessageBubble
                        key={msg.messageId}
                        message={msg}
                        isOwn={isOwn}
                        senderName={senderName}
                      />
                    );
                  })
                )}
              </div>

              {/* Message Composer */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={taskComment}
                  onChange={(e) => setTaskComment(e.target.value)}
                  placeholder="Post an execution comment or question..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendComment();
                  }}
                  className="flex-1 rounded-lg border border-brand-hairline px-3 py-2 text-xs bg-white text-brand-ink focus:outline-none focus:border-brand-primary"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!taskComment.trim()}
                  className="px-3 bg-brand-ink hover:bg-brand-primary-active text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center shadow-sm"
                >
                  Post
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
