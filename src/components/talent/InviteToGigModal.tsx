"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { jobService } from "@/lib/job-service";
import { Job } from "@/types/job";
import { invitationService } from "@/lib/invitation-service";
import { Loader2, Briefcase, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteToGigModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  aiMatchScore: number;
  aiReasoning: string;
}

export function InviteToGigModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  aiMatchScore,
  aiReasoning
}: InviteToGigModalProps) {
  const { user, profile } = useAuthStore();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = React.useState<string>("");
  const [message, setMessage] = React.useState<string>("");
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && user?.uid) {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      setMessage("");
      setSelectedJobId("");

      jobService.getJobs(user.uid, true).then(publishedJobs => {
        setJobs(publishedJobs);
        setIsLoading(false);
      }).catch(err => {
        console.error("Failed to fetch jobs:", err);
        setError("Failed to load your gigs. Please try again.");
        setIsLoading(false);
      });
    }
  }, [isOpen, user?.uid]);

  const handleSendInvite = async () => {
    if (!selectedJobId || !user?.uid || !profile?.name) return;

    setIsSending(true);
    setError(null);

    const job = jobs.find(j => j.jobId === selectedJobId);
    if (!job) return;

    try {
      await invitationService.createInvitation({
        businessId: user.uid,
        businessName: profile.name,
        studentId,
        jobId: job.jobId,
        jobTitle: job.title,
        message: message.trim() ? message.trim() : undefined,
        analyticsMetrics: {
          wasPersonalized: message.trim().length > 0,
          aiMatchScoreAtInvite: aiMatchScore
        }
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while sending the invite.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-[500px] overflow-hidden bg-white rounded-[16px] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-brand-hairline relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-brand-surface-soft hover:bg-brand-surface text-brand-muted transition-colors"
          >
            &times;
          </button>
          <div>
            <h2 className="text-xl font-semibold text-brand-ink flex items-center gap-2">
              Invite {studentName}
            </h2>
            <p className="text-sm text-brand-body mt-1">
              Select one of your published gigs to invite this candidate to apply.
            </p>
          </div>

          {/* AI Guidance Banner */}
          <div className="mt-4 bg-brand-primary/5 border border-brand-primary/20 rounded-[8px] p-3 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">AI Recruiter Guidance</p>
              <p className="text-xs text-brand-ink leading-relaxed">{aiReasoning}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-brand-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm font-medium">Loading your published gigs...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <div className="h-12 w-12 rounded-full bg-brand-success/10 flex items-center justify-center text-brand-success mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-brand-ink">Invitation Sent!</h3>
              <p className="text-sm text-brand-body">The candidate has been notified of your interest.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-brand-coral/10 border border-brand-coral/20 rounded-[8px] flex items-start gap-2.5 text-brand-coral text-sm font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Job Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-brand-ink">Select Gig</label>
                {jobs.length === 0 ? (
                  <div className="p-4 rounded-[8px] bg-brand-surface-soft border border-brand-hairline text-center text-sm text-brand-body">
                    You don't have any published gigs. Go to the Jobs tab to create one.
                  </div>
                ) : (
                  <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {jobs.map((job) => (
                      <button
                        key={job.jobId}
                        onClick={() => setSelectedJobId(job.jobId)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 text-left border rounded-[8px] transition-all",
                          selectedJobId === job.jobId
                            ? "border-brand-primary bg-brand-primary/5 shadow-[0_0_0_1px_rgba(var(--brand-primary),0.2)]"
                            : "border-brand-hairline bg-white hover:border-brand-primary/30"
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                          selectedJobId === job.jobId ? "bg-brand-primary text-white" : "bg-brand-surface-soft text-brand-muted"
                        )}>
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div className="flex-1 truncate">
                          <p className={cn("text-sm font-semibold truncate", selectedJobId === job.jobId ? "text-brand-ink" : "text-brand-ink")}>
                            {job.title}
                          </p>
                          <p className="text-xs text-brand-body truncate">{job.category} • {job.budget ? `$${job.budget}` : 'Variable'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Personalized Message */}
              {jobs.length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm font-semibold text-brand-ink">
                    <span>Recruiter Message</span>
                    <span className="text-xs font-normal text-brand-muted">Optional</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., 'We noticed your strong React portfolio and think you'd be a perfect fit...'"
                    className="w-full h-24 p-3 bg-white border border-brand-hairline rounded-[8px] text-sm text-brand-ink resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                  />
                  <p className="text-xs text-brand-muted">A personalized message increases conversion by 40%.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && !isLoading && jobs.length > 0 && (
          <div className="p-4 border-t border-brand-hairline bg-brand-surface-soft/30 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-surface-soft rounded-[8px] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvite}
              disabled={!selectedJobId || isSending}
              className="flex items-center gap-2 px-5 py-2 bg-brand-ink text-white text-sm font-semibold rounded-[8px] hover:bg-brand-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
