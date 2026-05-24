"use client";

import * as React from "react";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { Briefcase, User, FolderOpen, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChipProps {
  label: string;
  value: string;
  icon: React.ElementType;
  onClear: () => void;
}

function ContextChip({ label, value, icon: Icon, onClear }: ChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex shrink-0 items-center gap-1.5 rounded-[6px] border border-brand-hairline bg-white px-2 py-1"
    >
      <Icon className="h-3 w-3 text-brand-muted shrink-0" />
      <div className="flex items-center gap-1 min-w-0">
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-brand-muted">
          {label}:
        </span>
        <span className="max-w-[80px] truncate text-[10px] font-medium text-brand-ink">
          {value}
        </span>
      </div>
      <button
        onClick={onClear}
        className="shrink-0 text-brand-muted transition-colors hover:text-brand-ink cursor-pointer"
        aria-label={`Clear ${label} context`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </motion.div>
  );
}

export function ContextChips() {
  const { activeJob, activeProfile, activePortfolio, activeApplication, setContext, pageContext } =
    useHyperAIStore();

  const hasAny = activeJob || activeProfile || (activePortfolio && activePortfolio.length > 0) || activeApplication;

  if (!hasAny) return null;

  return (
    <div className="shrink-0 border-b border-brand-hairline bg-brand-surface-soft px-4 py-2">
      <div className="flex items-center gap-1 mb-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-success" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-muted">
          Active Context
        </span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        <AnimatePresence>
          {activeJob && (
            <ContextChip
              key="job"
              label="Gig"
              value={activeJob.title || "Active Job"}
              icon={Briefcase}
              onClear={() => setContext({ activeJob: null })}
            />
          )}
          {activeProfile && activeProfile.name && (
            <ContextChip
              key="profile"
              label="Profile"
              value={activeProfile.name}
              icon={User}
              onClear={() => setContext({ activeProfile: null })}
            />
          )}
          {activePortfolio && activePortfolio.length > 0 && (
            <ContextChip
              key="portfolio"
              label="Portfolio"
              value={`${activePortfolio.length} item${activePortfolio.length !== 1 ? "s" : ""}`}
              icon={FolderOpen}
              onClear={() => setContext({ activePortfolio: null })}
            />
          )}
          {activeApplication && (
            <ContextChip
              key="application"
              label="Application"
              value={activeApplication.jobTitle || "Active App"}
              icon={FileText}
              onClear={() => setContext({ activeApplication: null })}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
