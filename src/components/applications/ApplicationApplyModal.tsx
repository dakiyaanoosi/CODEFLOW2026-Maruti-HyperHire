"use client";

import * as React from "react";
import { X, Loader2, Send, Clock, IndianRupee, FileText, MessageSquare, AlertCircle, Sparkles } from "lucide-react";
import { Job } from "@/types/job";
import { ApplicationFormData } from "@/types/application";
import { applicationService } from "@/lib/application-service";
import { enhanceApplicationPitch } from "@/lib/ai-job-service";
import { useAuthStore } from "@/store/use-auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ApplicationApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
}

// Predefined options removed in favor of custom numeric input

export function ApplicationApplyModal({
  job,
  isOpen,
  onClose,
  onSuccess,
  studentId,
  studentName,
  studentAvatar,
}: ApplicationApplyModalProps) {
  const [form, setForm] = React.useState<ApplicationFormData>({
    coverLetter: "",
    proposalText: "",
    estimatedDeliveryDays: 7,
    proposedBudget: 0,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [tone, setTone] = React.useState<"Professional" | "Conversational">("Professional");
  const [upsellMsg, setUpsellMsg] = React.useState<string | null>(null);

  const { profile } = useAuthStore();

  const handleEnhance = async () => {
    if (!job) return;
    if (!form.coverLetter.trim() && !form.proposalText.trim()) {
      setError("Please add at least some text to enhance.");
      return;
    }
    
    setIsEnhancing(true);
    setError("");
    try {
      const result = await enhanceApplicationPitch({
        coverLetter: form.coverLetter,
        proposalText: form.proposalText,
        tone,
        jobTitle: job.title,
        jobDescription: job.description
      });
      
      setForm(f => ({
        ...f,
        coverLetter: result.enhancedCoverMessage ? result.enhancedCoverMessage.replace(/\r\n/g, "\n") : "",
        proposalText: result.enhancedProposalText ? result.enhancedProposalText.replace(/\r\n/g, "\n") : "",
        estimatedDeliveryDays: result.recommendedDays || f.estimatedDeliveryDays,
        proposedBudget: result.recommendedPrice || f.proposedBudget
      }));
      
      if (result.upsellSuggestion) {
        setUpsellMsg(result.upsellSuggestion);
      }
    } catch (err: unknown) {
      setError("AI Enhancement failed. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && job) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        coverLetter: "",
        proposalText: "",
        estimatedDeliveryDays: 7,
        proposedBudget: job.budget ? Math.round(job.budget * 0.9) : 0,
      });
      setError("");
      setFieldErrors({});
      setUpsellMsg(null);
    }
  }, [isOpen, job]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.coverLetter.trim() || form.coverLetter.trim().length < 15) {
      errs.coverLetter = "Cover message must be at least 15 characters.";
    }
    if (!form.proposalText.trim() || form.proposalText.trim().length < 30) {
      errs.proposalText = "Proposal must be at least 30 characters.";
    }
    if (form.proposedBudget <= 0) {
      errs.proposedBudget = "Please enter a valid price quote.";
    }
    return errs;
  };

  const handleSubmit = async () => {
    if (!job) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    setError("");
    try {
      await applicationService.submitApplication(
        form,
        job.jobId,
        job.title,
        job.companyName,
        job.businessId,
        studentId,
        studentName,
        studentAvatar
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-ink/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[12px] border border-brand-hairline bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-brand-hairline bg-white p-6 pb-4">
              <div>
                <h2 className="text-[20px] font-normal leading-[1.5] text-brand-ink">Apply for Gig</h2>
                <p className="mt-0.5 line-clamp-1 text-sm font-medium text-brand-muted">
                  {job.title} - {job.companyName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brand-hairline bg-white text-brand-muted"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {error && (
                <div className="flex items-start gap-2.5 rounded-[10px] border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-4">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Budget</p>
                  <p className="text-base font-semibold text-brand-ink">${job.budget?.toLocaleString()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Difficulty</p>
                  <p className="text-base font-semibold text-brand-ink">{job.difficultyLevel}</p>
                </div>
              </div>

              {/* Gig Description */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Gig Description</p>
                <div className="text-xs text-brand-body leading-relaxed bg-brand-surface-soft p-4 rounded-[10px] border border-brand-hairline max-h-[128px] overflow-y-auto whitespace-pre-wrap">
                  {job.description}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-4 text-xs leading-relaxed text-brand-body">
                <span>
                  Include your relevant experience, concrete deliverables, timeline, and any portfolio links the business should review.
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as "Professional" | "Conversational")}
                    className="h-8 rounded-[6px] border border-brand-hairline bg-white px-2 text-xs font-medium text-brand-ink outline-none"
                    disabled={isEnhancing}
                  >
                    <option value="Professional">Professional</option>
                    <option value="Conversational">Conversational</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    className="flex h-8 items-center gap-1.5 rounded-[6px] border border-brand-primary/30 bg-brand-primary/10 px-3 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/15 disabled:opacity-50"
                  >
                    {isEnhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    AI Enhance
                  </button>
                </div>
              </div>

              {upsellMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 rounded-[10px] border border-brand-mint/40 bg-brand-mint/5 p-4 text-sm text-brand-success shadow-sm"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-success" />
                  <div className="space-y-1">
                    <p className="font-semibold text-brand-success uppercase tracking-wider text-[11px]">AI Upsell Suggestion</p>
                    <p className="text-brand-body font-medium italic text-xs leading-relaxed">"{upsellMsg}"</p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                  <MessageSquare className="h-3.5 w-3.5 text-brand-muted" />
                  Cover Message
                </label>
                <textarea
                  value={form.coverLetter}
                  onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))}
                  placeholder="Introduce yourself and why you're a strong fit for this gig..."
                  rows={3}
                  className={cn(
                    "w-full resize-none rounded-[6px] border px-4 py-3 text-sm leading-relaxed text-brand-ink outline-none placeholder:text-zinc-400 focus:border-brand-info-border",
                    fieldErrors.coverLetter ? "border-red-400 bg-red-50" : "border-brand-hairline bg-white"
                  )}
                />
                {fieldErrors.coverLetter && <p className="text-xs text-red-600">{fieldErrors.coverLetter}</p>}
                <p className="text-xs text-brand-muted">{(form.coverLetter || "").length} characters</p>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                  <FileText className="h-3.5 w-3.5 text-brand-muted" />
                  Proposal / Approach
                </label>
                <textarea
                  value={form.proposalText}
                  onChange={(e) => setForm((f) => ({ ...f, proposalText: e.target.value }))}
                  placeholder="Describe your approach, deliverables, and how you'll handle this project..."
                  rows={5}
                  className={cn(
                    "w-full resize-none rounded-[6px] border px-4 py-3 text-sm leading-relaxed text-brand-ink outline-none placeholder:text-zinc-400 focus:border-brand-info-border",
                    fieldErrors.proposalText ? "border-red-400 bg-red-50" : "border-brand-hairline bg-white"
                  )}
                />
                {fieldErrors.proposalText && <p className="text-xs text-red-600">{fieldErrors.proposalText}</p>}
                <p className="text-xs text-brand-muted">{(form.proposalText || "").length} characters</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                    <Clock className="h-3.5 w-3.5 text-brand-muted" />
                    Estimated Delivery
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={form.estimatedDeliveryDays}
                      onChange={(e) => setForm((f) => ({ ...f, estimatedDeliveryDays: Math.max(1, Number(e.target.value)) }))}
                      className="h-11 w-full rounded-[6px] border border-brand-hairline bg-white pl-4 pr-12 text-sm text-brand-ink outline-none focus:border-brand-info-border"
                      placeholder="e.g. 7"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted font-medium pointer-events-none">
                      Days
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                    <IndianRupee className="h-3.5 w-3.5 text-brand-muted" />
                    Price Quote (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={form.proposedBudget}
                      onChange={(e) => setForm((f) => ({ ...f, proposedBudget: Number(e.target.value) }))}
                      className={cn(
                        "h-11 w-full rounded-[6px] border pl-7 pr-4 text-sm text-brand-ink outline-none focus:border-brand-info-border",
                        fieldErrors.proposedBudget ? "border-red-400 bg-red-50" : "border-brand-hairline bg-white"
                      )}
                    />
                  </div>
                  {fieldErrors.proposedBudget && <p className="text-xs text-red-600">{fieldErrors.proposedBudget}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-b-[12px] border-t border-brand-hairline bg-white px-6 py-4">
              <button onClick={onClose} className="rounded-[12px] border border-brand-hairline bg-white px-5 py-2.5 text-sm font-medium text-brand-ink">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
