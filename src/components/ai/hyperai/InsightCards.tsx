"use client";

import * as React from "react";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { AlertTriangle, Lightbulb, Info, Zap } from "lucide-react";
import { motion } from "framer-motion";

// ─── Severity classification ──────────────────────────────────────────────────

type Severity = "critical" | "warning" | "tip";

function classifySeverity(text: string): Severity {
  const lower = text.toLowerCase();
  // Critical: score drops, trust issues, missing items that strongly affect ranking
  if (
    lower.includes("lower") ||
    lower.includes("reduc") ||
    lower.includes("no portfolio") ||
    lower.includes("critical") ||
    lower.includes("missing") ||
    lower.includes("low budget") ||
    lower.includes("trust score")
  ) {
    return "critical";
  }
  // Warning: improvement suggestions that are actionable medium-priority
  if (
    lower.includes("add") ||
    lower.includes("improve") ||
    lower.includes("expand") ||
    lower.includes("weak") ||
    lower.includes("short") ||
    lower.includes("thin")
  ) {
    return "warning";
  }
  return "tip";
}

const SEVERITY_STYLES = {
  critical: {
    border: "border-l-brand-coral",
    bg: "bg-white",
    iconBg: "bg-brand-surface-soft text-brand-coral",
    Icon: AlertTriangle,
    label: "Critical",
    labelColor: "text-brand-coral",
  },
  warning: {
    border: "border-l-brand-mustard",
    bg: "bg-white",
    iconBg: "bg-brand-surface-soft text-brand-mustard",
    Icon: Zap,
    label: "Improve",
    labelColor: "text-brand-mustard",
  },
  tip: {
    border: "border-l-brand-mint",
    bg: "bg-white",
    iconBg: "bg-brand-surface-soft text-brand-success",
    Icon: Lightbulb,
    label: "Tip",
    labelColor: "text-brand-success",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InsightCards() {
  const { suggestions, sendMessage, isLoading } = useHyperAIStore();

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Info className="h-3 w-3 text-brand-muted" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
          AI Insights
        </p>
      </div>

      <div className="space-y-1.5">
        {suggestions.map((suggestion, idx) => {
          const severity = classifySeverity(suggestion);
          const s = SEVERITY_STYLES[severity];
          const Icon = s.Icon;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.07 }}
              className={`flex items-start gap-2.5 rounded-[8px] border border-brand-hairline border-l-4 ${s.border} ${s.bg} p-2.5`}
            >
              {/* Severity icon */}
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] ${s.iconBg}`}>
                <Icon className="h-2.5 w-2.5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-semibold uppercase tracking-wider ${s.labelColor}`}>
                    {s.label}
                  </span>
                </div>
                <p className="text-[11px] font-normal leading-[1.45] text-brand-body">
                  {suggestion}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
