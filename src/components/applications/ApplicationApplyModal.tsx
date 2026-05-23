"use client";

import * as React from "react";
import {
  X,
  Sparkles,
  Loader2,
  Send,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Job } from "@/types/job";
import { ApplicationFormData } from "@/types/application";
import { applicationService } from "@/lib/application-service";
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

const DELIVERY_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30];

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
    coverMessage: "",
    proposalText: "",
    estimatedDeliveryDays: 7,
    quotedPrice: 0,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [aiSuggestion, setAiSuggestion] = React.useState("");
  const [showAiPanel, setShowAiPanel] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen && job) {
      setForm({
        coverMessage: "",
        proposalText: "",
        estimatedDeliveryDays: 7,
        quotedPrice: job.budget ? Math.round(job.budget * 0.9) : 0,
      });
      setAiSuggestion("");
      setShowAiPanel(false);
      setError("");
      setFieldErrors({});
    }
  }, [isOpen, job]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.coverMessage.trim() || form.coverMessage.trim().length < 15)
      errs.coverMessage = "Cover message must be at least 15 characters.";
    if (!form.proposalText.trim() || form.proposalText.trim().length < 30)
      errs.proposalText = "Proposal must be at least 30 characters.";
    if (form.quotedPrice <= 0)
      errs.quotedPrice = "Please enter a valid price quote.";
    return errs;
  };

  const handleEnhanceWithAI = async () => {
    if (!job) return;
    setIsEnhancing(true);
    setShowAiPanel(true);
    await new Promise((r) => setTimeout(r, 1800));
    const skills = job.requiredSkills?.slice(0, 3).join(", ") || "relevant skills";
    const suggestion = `✨ AI Enhancement Suggestions for "${job.title}":

1. Open with a specific hook — mention ${skills} and a measurable outcome you've achieved.
2. Quantify your proposal: instead of "I will build the feature", say "I will deliver a fully tested, documented solution within ${form.estimatedDeliveryDays} days."
3. Your quoted price of $${form.quotedPrice} is ${form.quotedPrice < (job.budget || 0) ? "competitive" : "above budget — consider adjusting or justifying the premium with your expertise"}.
4. End with a clear call to action: invite the business to review your portfolio or set up a 15-minute discovery call.`;
    setAiSuggestion(suggestion);
    setIsEnhancing(false);
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
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[12px] border border-brand-hairline shadow-xl"
          >
            <div className="flex items-start justify-between p-6 pb-4 border-b border-brand-hairline sticky top-0 bg-white z-10 rounded-t-[12px]">
              <div>
                <h2 className="text-[20px] font-normal leading-[1.5] text-brand-ink">
                  Apply for Gig
                </h2>
                <p className="mt-0.5 text-sm text-brand-muted font-medium line-clamp-1">
                  {job.title} · {job.companyName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 mt-0.5 grid h-8 w-8 place-items-center rounded-full border border-brand-hairline bg-white text-brand-muted shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="flex items-start gap-2.5 rounded-[10px] bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 rounded-[10px] bg-brand-surface-soft border border-brand-hairline p-4">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Budget</p>
                  <p className="text-base font-semibold text-brand-ink">${job.budget?.toLocaleString()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">Difficulty</p>
                  <p className="text-base font-semibold text-brand-ink">{job.difficultyLevel}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                  <MessageSquare className="h-3.5 w-3.5 text-brand-muted" />
                  Cover Message
                </label>
                <textarea
                  value={form.coverMessage}
                  onChange={(e) => setForm((f) => ({ ...f, coverMessage: e.target.value }))}
                  placeholder="Introduce yourself and why you're a great fit for this gig…"
                  rows={3}
                  className={cn(
                    "w-full resize-none rounded-[6px] border px-4 py-3 text-sm text-brand-ink placeholder:text-brand-muted outline-none focus:border-brand-info-border leading-relaxed",
                    fieldErrors.coverMessage ? "border-red-400 bg-red-50" : "border-brand-hairline bg-white"
                  )}
                />
                {fieldErrors.coverMessage && (
                  <p className="text-xs text-red-600">{fieldErrors.coverMessage}</p>
                )}
                <p className="text-xs text-brand-muted">{form.coverMessage.length} characters</p>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                  <FileText className="h-3.5 w-3.5 text-brand-muted" />
                  Proposal / Approach
                </label>
                <textarea
                  value={form.proposalText}
                  onChange={(e) => setForm((f) => ({ ...f, proposalText: e.target.value }))}
                  placeholder="Describe your approach, deliverables, and how you'll handle this project…"
                  rows={5}
                  className={cn(
                    "w-full resize-none rounded-[6px] border px-4 py-3 text-sm text-brand-ink placeholder:text-brand-muted outline-none focus:border-brand-info-border leading-relaxed",
                    fieldErrors.proposalText ? "border-red-400 bg-red-50" : "border-brand-hairline bg-white"
                  )}
                />
                {fieldErrors.proposalText && (
                  <p className="text-xs text-red-600">{fieldErrors.proposalText}</p>
                )}
                <p className="text-xs text-brand-muted">{form.proposalText.length} characters</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                    <Clock className="h-3.5 w-3.5 text-brand-muted" />
                    Estimated Delivery
                  </label>
                  <select
                    value={form.estimatedDeliveryDays}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, estimatedDeliveryDays: Number(e.target.value) }))
                    }
                    className="h-11 w-full rounded-[6px] border border-brand-hairline bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-info-border"
                  >
                    {DELIVERY_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? "day" : "days"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                    <DollarSign className="h-3.5 w-3.5 text-brand-muted" />
                    Price Quote (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">$</span>
                    <input
                      type="number"
                      min={1}
                      value={form.quotedPrice}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, quotedPrice: Number(e.target.value) }))
                      }
                      className={cn(
                        "h-11 w-full rounded-[6px] border pl-7 pr-4 text-sm text-brand-ink outline-none focus:border-brand-info-border",
                        fieldErrors.quotedPrice ? "border-red-400 bg-red-50" : "border-brand-hairline bg-white"
                      )}
                    />
                  </div>
                  {fieldErrors.quotedPrice && (
                    <p className="text-xs text-red-600">{fieldErrors.quotedPrice}</p>
                  )}
                </div>
              </div>

              <div className="rounded-[10px] border border-brand-hairline overflow-hidden">
                <button
                  onClick={() => {
                    if (!showAiPanel) handleEnhanceWithAI();
                    else setShowAiPanel((p) => !p);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 bg-brand-surface-soft text-sm font-medium text-brand-ink"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-info" />
                    AI Proposal Enhancement
                  </span>
                  {showAiPanel ? (
                    <ChevronUp className="h-4 w-4 text-brand-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-brand-muted" />
                  )}
                </button>
                <AnimatePresence>
                  {showAiPanel && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-white border-t border-brand-hairline min-h-[80px]">
                        {isEnhancing ? (
                          <div className="flex items-center gap-2.5 text-sm text-brand-muted py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-brand-info" />
                            Analyzing job requirements and generating suggestions…
                          </div>
                        ) : aiSuggestion ? (
                          <pre className="whitespace-pre-wrap text-xs text-brand-body leading-relaxed font-sans">
                            {aiSuggestion}
                          </pre>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-brand-hairline bg-white rounded-b-[12px]">
              <button
                onClick={onClose}
                className="rounded-[12px] border border-brand-hairline bg-white px-5 py-2.5 text-sm font-medium text-brand-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-[12px] bg-brand-ink px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
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
