"use client";

import * as React from "react";
import { Workflow } from "@/types/workflow";
import { Milestone } from "@/types/milestone";
import { Deliverable } from "@/types/deliverable";
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Eye, 
  ArrowUpRight, 
  Clock, 
  CornerDownRight,
  Send,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ReviewWorkspaceProps {
  workflow: Workflow;
  activeMilestone: Milestone | null;
  deliverables: Deliverable[];
  actorRole: "student" | "business";
  isSubmitting: boolean;
  onApproveDeliverable: (deliverableId: string) => Promise<void>;
  onRequestRevision: (deliverableId: string, feedback: string) => Promise<void>;
  onAddComment: (deliverableId: string, text: string) => Promise<void>;
  onSubmitDeliverableClick: () => void;
}

export function ReviewWorkspace({
  workflow,
  activeMilestone,
  deliverables,
  actorRole,
  isSubmitting,
  onApproveDeliverable,
  onRequestRevision,
  onAddComment,
  onSubmitDeliverableClick,
}: ReviewWorkspaceProps) {
  const [expandedDelivId, setExpandedDelivId] = React.useState<string | null>(null);
  const [feedbackNotes, setFeedbackNotes] = React.useState<Record<string, string>>({});
  const [commentTexts, setCommentTexts] = React.useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = React.useState<"pending" | "revision" | "approved">("pending");

  if (!activeMilestone) return null;

  const isBusiness = actorRole === "business";

  // Group deliverables
  const pendingReview = deliverables.filter(d => d.reviewStatus === "pending_review");
  const revisionRequested = deliverables.filter(d => d.reviewStatus === "revision_requested");
  const approved = deliverables.filter(d => d.reviewStatus === "approved");

  // Automatically set expanded deliverable if there's only one pending
  React.useEffect(() => {
    if (expandedDelivId === null) {
      if (pendingReview.length > 0) {
        setExpandedDelivId(pendingReview[0].deliverableId);
      } else if (revisionRequested.length > 0) {
        setExpandedDelivId(revisionRequested[0].deliverableId);
      } else if (approved.length > 0) {
        setExpandedDelivId(approved[0].deliverableId);
      }
    }
  }, [deliverables, pendingReview, revisionRequested, approved, expandedDelivId]);

  const handleApprove = async (id: string) => {
    try {
      await onApproveDeliverable(id);
    } catch (err) {
      alert("Failed to approve deliverable.");
    }
  };

  const handleRevision = async (id: string) => {
    const note = feedbackNotes[id]?.trim();
    if (!note) {
      alert("Please enter revision instructions before rejecting.");
      return;
    }
    try {
      await onRequestRevision(id, note);
      setFeedbackNotes(prev => ({ ...prev, [id]: "" }));
    } catch (err) {
      alert("Failed to request revision.");
    }
  };

  const handleAddCommentLocal = async (id: string) => {
    const text = commentTexts[id]?.trim();
    if (!text) return;
    try {
      await onAddComment(id, text);
      setCommentTexts(prev => ({ ...prev, [id]: "" }));
    } catch (err) {
      alert("Failed to add comment.");
    }
  };

  return (
    <div className="p-5 rounded-xl border border-brand-hairline bg-white shadow-sm space-y-4">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-hairline pb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wider">
            {isBusiness ? "Deliverables Review Desk" : "Deliverables & Submission Center"}
          </h3>
          <p className="text-xs text-brand-muted mt-0.5">
            {isBusiness 
              ? "Review students submissions, download assets, and manage revision feedback loops."
              : "Track submit history, response feedback, and deliver project artifacts."}
          </p>
        </div>

        {!isBusiness && activeMilestone.status !== "approved" && (
          <button
            onClick={onSubmitDeliverableClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-ink hover:bg-brand-primary-active text-white rounded-[8px] text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Submit Deliverable v{deliverables.length + 1}
          </button>
        )}
      </div>

      {/* Structured Category Selector Tabs */}
      <div className="flex border-b border-brand-hairline/80 gap-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={cn(
            "pb-2.5 text-xs font-semibold tracking-[0.2px] border-b-2 transition-all cursor-pointer relative",
            activeTab === "pending"
              ? "border-brand-ink text-brand-ink"
              : "border-transparent text-brand-muted hover:text-brand-ink"
          )}
        >
          Pending Review
          {pendingReview.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-brand-info/10 text-brand-info font-bold text-[9px]">
              {pendingReview.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("revision")}
          className={cn(
            "pb-2.5 text-xs font-semibold tracking-[0.2px] border-b-2 transition-all cursor-pointer relative",
            activeTab === "revision"
              ? "border-brand-ink text-brand-ink"
              : "border-transparent text-brand-muted hover:text-brand-ink"
          )}
        >
          Revision Requested
          {revisionRequested.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-brand-coral/10 text-brand-coral font-bold text-[9px]">
              {revisionRequested.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={cn(
            "pb-2.5 text-xs font-semibold tracking-[0.2px] border-b-2 transition-all cursor-pointer relative",
            activeTab === "approved"
              ? "border-brand-ink text-brand-ink"
              : "border-transparent text-brand-muted hover:text-brand-ink"
          )}
        >
          Approved Assets
          {approved.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-brand-success/15 text-brand-success font-bold text-[9px]">
              {approved.length}
            </span>
          )}
        </button>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {/* Helper variables */}
        {(() => {
          const currentList = 
            activeTab === "pending" ? pendingReview :
            activeTab === "revision" ? revisionRequested : approved;

          if (currentList.length === 0) {
            return (
              <div className="py-8 text-center border border-dashed border-brand-hairline rounded-xl bg-brand-surface-soft/10">
                <FileText className="h-8 w-8 text-brand-muted mx-auto opacity-20 mb-2" />
                <p className="text-xs text-brand-muted font-medium capitalize">No deliverables in {activeTab} stage.</p>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-3">
              {currentList.map((deliv) => {
                const isExpanded = expandedDelivId === deliv.deliverableId;
                const submittedDate = deliv.submittedAt ? new Date(deliv.submittedAt as string) : null;
                const reviewedDate = deliv.reviewedAt ? new Date(deliv.reviewedAt as string) : null;

                return (
                  <div 
                    key={deliv.deliverableId}
                    className={cn(
                      "border border-brand-hairline rounded-xl shadow-sm overflow-hidden bg-white transition-all hover:border-brand-primary/40",
                      isExpanded && "ring-1 ring-brand-ink/5 border-brand-primary/50"
                    )}
                  >
                    {/* Deliverable Header Row */}
                    <div 
                      onClick={() => setExpandedDelivId(isExpanded ? null : deliv.deliverableId)}
                      className="flex items-center justify-between px-4 py-3 bg-brand-surface-soft/20 hover:bg-brand-surface-soft/40 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold shrink-0">
                          v{deliv.version}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-brand-ink truncate">{deliv.title}</h4>
                          <span className="text-[9px] text-brand-muted mt-0.5 block font-mono">
                            Submitted {submittedDate ? formatDistanceToNow(submittedDate) + " ago" : "unknown date"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border",
                          deliv.reviewStatus === "approved" ? "bg-brand-success/10 text-brand-success border-brand-success/20" :
                          deliv.reviewStatus === "revision_requested" ? "bg-brand-coral/10 text-brand-coral border-brand-coral/20" :
                          "bg-brand-info/10 text-brand-info border-brand-info/20"
                        )}>
                          {deliv.reviewStatus.replace("_", " ")}
                        </span>
                        <Eye className={cn(
                          "w-4 h-4 text-brand-muted transition-transform",
                          isExpanded && "rotate-185 text-brand-ink"
                        )} />
                      </div>
                    </div>

                    {/* Expandable Review Workspace Panel */}
                    {isExpanded && (
                      <div className="p-4 border-t border-brand-hairline bg-white space-y-4 animate-in slide-in-from-top-2 duration-150">
                        {/* Submitter Notes */}
                        {deliv.description && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Submission Notes</span>
                            <p className="text-xs text-brand-body leading-relaxed whitespace-pre-wrap">{deliv.description}</p>
                          </div>
                        )}

                        {/* Deliverable File URLs */}
                        {deliv.files && deliv.files.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Submited Artifacts</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {deliv.files.map((fileUrl, fIdx) => (
                                <a
                                  key={fIdx}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-between p-2.5 rounded-lg border border-brand-hairline bg-brand-surface-soft/40 hover:bg-brand-surface-soft hover:border-brand-primary/40 transition-all group text-xs text-brand-ink"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-brand-muted shrink-0" />
                                    <span className="truncate font-medium">{`artifact_file_${fIdx + 1}.${fileUrl.split(".").pop()?.split("?")[0] || "file"}`}</span>
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-brand-muted group-hover:text-brand-link transition-colors" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reviewer Feedback Input Loop (inline for Businesses) */}
                        {isBusiness && deliv.reviewStatus === "pending_review" && (
                          <div className="p-4 rounded-xl border border-brand-hairline bg-brand-surface-soft/30 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-brand-hairline pb-2">
                              <h5 className="text-[10px] font-bold text-brand-ink uppercase tracking-wider">Evaluation Control</h5>
                              <span className="text-[9px] text-brand-muted">Action will sync instantly to milestone</span>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Revision Instructions (Required for revisions)</label>
                              <textarea
                                value={feedbackNotes[deliv.deliverableId] || ""}
                                onChange={(e) => setFeedbackNotes(prev => ({ ...prev, [deliv.deliverableId]: e.target.value }))}
                                rows={3}
                                placeholder="E.g., Please fix the responsive design on mobile columns..."
                                className="w-full rounded-md border border-brand-hairline p-2.5 text-xs bg-white text-brand-ink placeholder:text-brand-muted resize-none focus:outline-none focus:border-brand-info"
                              />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-0.5">
                              <button
                                onClick={() => handleRevision(deliv.deliverableId)}
                                disabled={isSubmitting || !feedbackNotes[deliv.deliverableId]?.trim()}
                                className="px-3.5 py-2 border border-brand-coral text-brand-coral hover:bg-brand-coral/5 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                              >
                                Request Revision
                              </button>
                              <button
                                onClick={() => handleApprove(deliv.deliverableId)}
                                disabled={isSubmitting}
                                className="px-3.5 py-2 bg-brand-success text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                Approve Deliverable
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Display existing review feedback */}
                        {(deliv.reviewedBy || deliv.feedback) && (
                          <div className="border-t border-brand-hairline pt-3.5 space-y-2">
                            <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Review Comments</span>
                            <div className="flex gap-2.5 text-xs items-start bg-[#fffbf0]/40 p-3 rounded-xl border border-brand-mustard/20">
                              <MessageSquare className="w-4 h-4 text-brand-mustard shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-semibold text-brand-ink">
                                  {deliv.reviewedBy === workflow.businessId ? workflow.businessName : "Business Client"}
                                  <span className="text-[10px] text-brand-muted font-normal capitalize ml-1">(Client)</span>
                                </p>
                                {deliv.feedback && <p className="text-brand-muted leading-relaxed whitespace-pre-wrap">{deliv.feedback}</p>}
                                {reviewedDate && (
                                  <p className="text-[9px] text-brand-muted/80 font-mono mt-0.5">
                                    {reviewedDate.toLocaleDateString()} {reviewedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive Discussion Thread (Inline comments) */}
                        <div className="border-t border-brand-hairline pt-3.5 space-y-3">
                          <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Revision Thread</span>
                          
                          {deliv.comments && deliv.comments.length > 0 ? (
                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                              {deliv.comments.map((comment) => {
                                const isAuthorClient = comment.authorRole === "business";
                                return (
                                  <div key={comment.commentId} className="flex gap-2 text-xs items-start pl-2">
                                    <CornerDownRight className="w-3.5 h-3.5 text-brand-hairline shrink-0 mt-0.5" />
                                    <div className="flex-1 bg-brand-surface-soft/60 border border-brand-hairline/60 rounded-xl px-3 py-2 space-y-0.5">
                                      <div className="flex justify-between items-center w-full">
                                        <span className="font-semibold text-brand-ink">
                                          {comment.authorName}
                                          <span className="text-[9px] text-brand-muted font-normal capitalize ml-1">({comment.authorRole})</span>
                                        </span>
                                        <span className="text-[9px] text-brand-muted font-mono">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                                      </div>
                                      <p className="text-brand-muted leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[11px] text-brand-muted pl-2">No comments have been posted to this deliverable thread.</p>
                          )}

                          {/* Add comment form */}
                          <div className="flex gap-2 pl-2">
                            <input
                              type="text"
                              value={commentTexts[deliv.deliverableId] || ""}
                              onChange={(e) => setCommentTexts(prev => ({ ...prev, [deliv.deliverableId]: e.target.value }))}
                              placeholder="Write a message in this revision loop..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddCommentLocal(deliv.deliverableId);
                              }}
                              className="flex-1 rounded-lg border border-brand-hairline px-3 py-1.5 text-xs bg-white text-brand-ink focus:outline-none focus:border-brand-primary"
                            />
                            <button
                              onClick={() => handleAddCommentLocal(deliv.deliverableId)}
                              disabled={!commentTexts[deliv.deliverableId]?.trim()}
                              className="px-3 bg-brand-surface-soft border border-brand-hairline text-brand-ink hover:bg-brand-surface-strong rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                              <Send className="w-3 h-3 text-brand-muted" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
