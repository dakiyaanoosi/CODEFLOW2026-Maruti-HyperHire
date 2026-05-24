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
  mint:   { accent: "border-l-brand-success", icon: "text-brand-success", text: "text-brand-ink" },
  peach:  { accent: "border-l-brand-coral", icon: "text-brand-coral", text: "text-brand-ink" },
  yellow: { accent: "border-l-brand-mustard", icon: "text-brand-mustard", text: "text-brand-ink" },
  ink:    { accent: "border-l-brand-ink", icon: "text-brand-muted", text: "text-brand-ink" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickActions() {
  const { quickActions, sendMessage, isLoading } = useHyperAIStore();

  if (!quickActions || quickActions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
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
              className={`group flex w-full items-center gap-2.5 rounded-[8px] border border-l-4 border-brand-hairline bg-white px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${colors.accent}`}
            >
              {/* Icon container */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border border-brand-hairline bg-brand-surface-soft">
                <Icon className={`h-3 w-3 ${colors.icon}`} />
              </div>

              {/* Label */}
              <span className={`flex-1 text-[11px] font-medium leading-none ${colors.text}`}>
                {action}
              </span>

              {/* Chevron */}
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 opacity-50 ${colors.icon}`}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
