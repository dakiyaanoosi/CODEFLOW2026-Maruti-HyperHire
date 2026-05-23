"use client";

import * as React from "react";
import {
  X,
  Briefcase,
  Calendar,
  MapPin,
  DollarSign,
  Flame,
  Zap,
  Sparkles,
  CheckCircle2,
  Clock,
  BarChart2,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { JobWithMatchScore } from "@/types/marketplace";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ApplicationApplyModal } from "@/components/applications/ApplicationApplyModal";
import { useAuthStore } from "@/store/use-auth-store";

interface MarketplaceJobDetailModalProps {
  job: JobWithMatchScore | null;
  isOpen: boolean;
  onClose: () => void;
  userSkills?: string[];
}

function MatchBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "#006400"
      : score >= 60
      ? "#254fad"
      : score >= 40
      ? "#d9a441"
      : "#aa2d00";

  const label =
    score >= 80 ? "Strong Match" : score >= 60 ? "Good Match" : score >= 40 ? "Partial Match" : "Low Match";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          AI Match Score
        </span>
        <span className="text-sm font-bold" style={{ color }}>
          {score}% — {label}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-brand-surface-strong overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export function MarketplaceJobDetailModal({
  job,
  isOpen,
  onClose,
  userSkills = [],
}: MarketplaceJobDetailModalProps) {
  const { user, profile } = useAuthStore();
  const [applyModalOpen, setApplyModalOpen] = React.useState(false);
  const [appliedSuccess, setAppliedSuccess] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!job) return null;

  const formattedDeadline = new Date(job.deadline).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const daysLeft = Math.ceil(
    (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const matchedSkills = userSkills.length
    ? job.requiredSkills.filter((s) =>
        userSkills.some(
          (us) =>
            us.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(us.toLowerCase())
        )
      )
    : [];

  const difficultyConfig = {
    Beginner: { text: "text-[#006400]", bg: "bg-[#0a2e0e]/8 border-[#006400]/20" },
    Intermediate: { text: "text-[#254fad]", bg: "bg-[#254fad]/8 border-[#254fad]/20" },
    Advanced: { text: "text-[#aa2d00]", bg: "bg-[#aa2d00]/8 border-[#aa2d00]/20" },
  };
  const diff = difficultyConfig[job.difficultyLevel];

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-brand-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] flex flex-col bg-white shadow-2xl"
          >
            {/* Accent strip */}
            <div
              className="h-[4px] w-full shrink-0"
              style={{
                background:
                  job.matchScore >= 80
                    ? "#006400"
                    : job.matchScore >= 60
                    ? "#254fad"
                    : job.matchScore >= 40
                    ? "#d9a441"
                    : "#aa2d00",
              }}
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-brand-hairline shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {job.isNew && (
                    <span className="flex items-center gap-1 rounded-[5px] bg-[#254fad]/10 border border-[#254fad]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#254fad]">
                      <Zap className="h-2.5 w-2.5" /> New
                    </span>
                  )}
                  {job.isTrending && (
                    <span className="flex items-center gap-1 rounded-[5px] bg-[#aa2d00]/8 border border-[#aa2d00]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#aa2d00]">
                      <Flame className="h-2.5 w-2.5" /> Trending
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-[5px] border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                      diff.bg,
                      diff.text
                    )}
                  >
                    {job.difficultyLevel}
                  </span>
                </div>
                <h2 className="text-[20px] font-medium leading-[1.3] text-brand-ink">
                  {job.title}
                </h2>
                <p className="mt-1 text-sm text-brand-muted font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {job.companyName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-[8px] border border-brand-hairline p-1.5 text-brand-muted hover:text-brand-ink hover:bg-brand-surface-soft transition-colors shrink-0 mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    icon: DollarSign,
                    label: "Budget",
                    value: `$${job.budget.toLocaleString()}`,
                    color: "text-brand-ink",
                  },
                  {
                    icon: MapPin,
                    label: "Mode",
                    value: job.workMode,
                    color: "text-brand-body",
                  },
                  {
                    icon: daysLeft <= 7 ? Clock : Calendar,
                    label: "Deadline",
                    value: daysLeft <= 7 ? `${daysLeft}d left` : `${daysLeft} days`,
                    color: daysLeft <= 7 ? "text-[#aa2d00]" : "text-brand-body",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col gap-1 rounded-[10px] border border-brand-hairline bg-brand-surface-soft px-3 py-2.5"
                  >
                    <div className="flex items-center gap-1 text-brand-muted">
                      <stat.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        {stat.label}
                      </span>
                    </div>
                    <span className={cn("text-sm font-bold", stat.color)}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Match score bar */}
              <div className="rounded-[10px] border border-brand-hairline bg-brand-surface-soft px-4 py-3.5">
                <MatchBar score={job.matchScore} />
                {matchedSkills.length > 0 && (
                  <p className="mt-2 text-[11px] text-brand-muted font-medium">
                    You match on:{" "}
                    <span className="text-[#006400] font-semibold">
                      {matchedSkills.join(", ")}
                    </span>
                  </p>
                )}
              </div>

              {/* AI Summary */}
              {job.aiGeneratedSummary && (
                <div className="rounded-[10px] border border-brand-hairline/60 bg-brand-surface-soft px-4 py-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-brand-info" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                      AI Summary
                    </span>
                  </div>
                  <p className="text-sm text-brand-body leading-relaxed">
                    {job.aiGeneratedSummary}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                  About This Gig
                </h4>
                <p className="text-sm text-brand-body leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Required Skills */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2.5">
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) => {
                    const isMatched = matchedSkills.includes(skill);
                    return (
                      <span
                        key={skill}
                        className={cn(
                          "rounded-[6px] px-2.5 py-1 text-xs font-medium border",
                          isMatched
                            ? "bg-[#006400]/8 text-[#006400] border-[#006400]/25"
                            : "bg-brand-surface-soft text-brand-muted border-brand-hairline"
                        )}
                      >
                        {isMatched && "✓ "}
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Deliverables */}
              {job.deliverables && job.deliverables.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2.5">
                    Deliverables
                  </h4>
                  <ul className="space-y-1.5">
                    {job.deliverables.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-brand-body"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-success" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Category + Difficulty meta */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-brand-muted font-medium">
                  <Briefcase className="h-3.5 w-3.5" />
                  {job.category}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-brand-muted font-medium">
                  <BarChart2 className="h-3.5 w-3.5" />
                  {job.difficultyLevel} level
                </div>
                <div className="flex items-center gap-1.5 text-xs text-brand-muted font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDeadline}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="shrink-0 px-6 py-4 border-t border-brand-hairline bg-white">
              <div className="flex items-center gap-3">
                {appliedSuccess ? (
                  <div className="flex-1 flex items-center justify-center gap-2 rounded-[12px] bg-brand-success/10 border border-brand-success/20 px-5 py-3 text-sm font-semibold text-brand-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Application Submitted
                  </div>
                ) : (
                  <button
                    onClick={() => setApplyModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-[12px] bg-brand-ink px-5 py-3 text-sm font-semibold text-white hover:bg-brand-primary-active active:scale-[0.98] transition-all shadow-sm"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Apply for this Gig
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-[12px] border border-brand-hairline bg-white px-4 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-surface-soft transition-colors"
                >
                  Back
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-brand-muted font-medium">
                Posted by {job.companyName} · Closes in {daysLeft} days
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {job && (
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
        studentAvatar={undefined}
      />
    )}
  </>
  );
}
