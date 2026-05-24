"use client";

import * as React from "react";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import {
  User,
  Sparkles,
  BarChart2,
  FileText,
  Settings,
  TrendingUp,
  Zap,
  Target,
  Brain,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Action config ────────────────────────────────────────────────────────────

interface ActionConfig {
  icon: React.ElementType;
  color: "mint" | "peach" | "yellow" | "ink";
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  // Student
  "Improve Profile":          { icon: User,       color: "mint" },
  "Suggest Trending Skills":  { icon: TrendingUp,  color: "yellow" },
  "Analyze Portfolio":        { icon: BarChart2,   color: "peach" },
  "Explain Match Score":      { icon: Target,      color: "peach" },
  "Optimize Proposal":        { icon: FileText,    color: "mint" },
  // Business
  "Improve Gig":              { icon: Settings,    color: "peach" },
  "Optimize Hiring Requirements": { icon: Brain,   color: "mint" },
  "Predict Application Quality":  { icon: Zap,     color: "yellow" },
  "Analyze Candidate Quality":    { icon: User,    color: "peach" },
  "Improve Budget Clarity":       { icon: BarChart2, color: "yellow" },
};

const COLOR_MAP = {
  mint:   { bg: "bg-brand-mint/15",   border: "border-brand-mint/25",   icon: "text-brand-success",  text: "text-brand-ink" },
  peach:  { bg: "bg-brand-peach/10",  border: "border-brand-peach/30",  icon: "text-brand-coral",    text: "text-brand-ink" },
  yellow: { bg: "bg-brand-yellow/10", border: "border-brand-yellow/30", icon: "text-brand-mustard",  text: "text-brand-ink" },
  ink:    { bg: "bg-brand-ink/5",     border: "border-brand-hairline",  icon: "text-brand-muted",    text: "text-brand-ink" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickActions() {
  const { quickActions, sendMessage, isLoading } = useHyperAIStore();

  if (!quickActions || quickActions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold uppercase tracking-widest text-brand-muted/70">
        Quick Actions
      </p>

      <div className="flex flex-col gap-1.5">
        {quickActions.map((action, idx) => {
          const config = ACTION_CONFIG[action] ?? { icon: Sparkles, color: "ink" as const };
          const Icon = config.icon;
          const colors = COLOR_MAP[config.color];

          return (
            <motion.button
              key={action}
              id={`hyperai-action-${idx}`}
              disabled={isLoading}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => sendMessage(action)}
              className={`group flex w-full items-center gap-2.5 rounded-[8px] border px-3 py-2.5 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${colors.bg} ${colors.border}`}
            >
              {/* Icon container */}
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border ${colors.border} bg-white/60`}>
                <Icon className={`h-3 w-3 ${colors.icon}`} />
              </div>

              {/* Label */}
              <span className={`flex-1 text-[11px] font-semibold leading-none ${colors.text}`}>
                {action}
              </span>

              {/* Chevron */}
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 opacity-30 transition-transform group-hover:translate-x-0.5 group-hover:opacity-70 ${colors.icon}`}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
