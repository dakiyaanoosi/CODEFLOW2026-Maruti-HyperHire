"use client";

import * as React from "react";
import { X, Calendar, MapPin, DollarSign, BarChart2, Pencil, Trash2, AlertTriangle, Loader2, CheckSquare, Send } from "lucide-react";
import { Job } from "@/types/job";
import { jobService } from "@/lib/job-service";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ApplicationApplyModal } from "@/components/applications/ApplicationApplyModal";
import { useAuthStore } from "@/store/use-auth-store";

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDeleteSuccess: (jobId: string) => void;
  canManage?: boolean;
}

export function JobDetailsModal({
  job,
  isOpen,
  onClose,
  onEdit,
  onDeleteSuccess,
  canManage = true,
}: JobDetailsModalProps) {
  const { user, profile } = useAuthStore();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [applyModalOpen, setApplyModalOpen] = React.useState(false);
  const [appliedSuccess, setAppliedSuccess] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowDeleteConfirm(false);
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen || !job) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await jobService.deleteJob(job.jobId);
      onDeleteSuccess(job.jobId);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete gig listing. Please try again.");
      setIsDeleting(false);
    }
  };

  const formattedDeadline = new Date(job.deadline).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedCreated = new Date(job.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="relative z-10 flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-[12px] border border-brand-hairline bg-white shadow-2xl overflow-hidden text-brand-ink"
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-brand-hairline px-6 bg-brand-surface-soft shrink-0">
            <div className="flex items-center gap-2.5">
              <span className={cn(
                "rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold uppercase font-mono",
                job.status === "Published" ? "bg-brand-success/15 text-brand-success border-brand-success/20" : "bg-brand-surface-strong text-brand-muted border-brand-hairline"
              )}>
                {job.status}
              </span>
              <span className="text-xs font-semibold text-brand-muted flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.workMode}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-brand-muted hover:text-brand-ink transition-colors p-1"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="m-6 flex items-start gap-2 rounded-[6px] bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Content Details */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Header Title */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h1 className="text-xl md:text-2xl font-semibold leading-[1.3] text-brand-ink">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                    <span className="font-semibold text-brand-body">{job.companyName}</span>
                    <span className="h-1 w-1 rounded-full bg-brand-hairline" />
                    <span>Posted {formattedCreated}</span>
                  </div>
                </div>

                {/* Edit / Delete actions for business owner */}
                {canManage && !showDeleteConfirm && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={onEdit}
                      className="flex items-center gap-1.5 rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-surface-soft transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Post
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 rounded-[8px] border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Delete confirmation panel */}
              {showDeleteConfirm && (
                <div className="rounded-[10px] border border-red-200 bg-red-50/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-800">Confirm Deletion</p>
                      <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                        Are you sure you want to delete this job listing? This action is permanent and cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="rounded-[8px] border border-brand-hairline bg-white px-3 py-1.5 text-xs font-semibold text-brand-muted hover:bg-brand-surface-soft transition-colors disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-1.5 rounded-[8px] bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Yes, Delete Post"
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-brand-hairline" />

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-4 rounded-[10px] border border-brand-hairline bg-brand-surface-soft/60 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Budget</span>
                  <span className="text-base font-bold text-brand-ink flex items-center">
                    <DollarSign className="h-4 w-4 text-brand-muted shrink-0 -ml-0.5" />
                    {job.budget}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Deadline</span>
                  <span className="text-sm font-semibold text-brand-ink flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-brand-muted shrink-0" />
                    {formattedDeadline}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Difficulty</span>
                  <span className="text-sm font-semibold text-brand-ink flex items-center gap-1">
                    <BarChart2 className="h-3.5 w-3.5 text-brand-muted shrink-0" />
                    {job.difficultyLevel}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Description</h3>
                <p className="text-sm text-brand-body leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {/* Required Skills */}
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Skills Required</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-[8px] bg-brand-surface-soft px-3 py-1.5 text-xs font-medium text-brand-muted border border-brand-hairline"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverables */}
              {job.deliverables && job.deliverables.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Expected Deliverables</h3>
                  <ul className="space-y-2 text-sm text-brand-body">
                    {job.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckSquare className="h-4 w-4 text-brand-success shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!canManage && (
                <div className="pt-2">
                  {appliedSuccess ? (
                    <div className="flex items-center justify-center gap-2 rounded-[12px] bg-brand-success/10 border border-brand-success/20 px-5 py-3 text-sm font-semibold text-brand-success">
                      Application Submitted
                    </div>
                  ) : (
                    <button
                      onClick={() => setApplyModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-[12px] bg-brand-ink px-5 py-3 text-sm font-semibold text-white shadow-sm"
                    >
                      <Send className="h-4 w-4" />
                      Apply for this Gig
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>

    {job && !canManage && (
      <ApplicationApplyModal
        job={job}
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={() => {
          setApplyModalOpen(false);
          setAppliedSuccess(true);
        }}
        studentId={user?.uid || "guest"}
        studentName={profile?.name || user?.displayName || "Student"}
      />
    )}
  </>
  );
}
