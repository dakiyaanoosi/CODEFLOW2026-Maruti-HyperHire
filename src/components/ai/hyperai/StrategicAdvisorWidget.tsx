"use client";

import * as React from "react";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { ContextualInsight } from "@/types/hyperai";
import { BrainCircuit, X, ChevronRight, Activity, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function StrategicAdvisorWidget() {
  const { insights, ecosystemSummary, dismissInsight } = useHyperAIStore();

  if (!ecosystemSummary || insights.length === 0) {
    return null; // Don't render if no insights exist to avoid clutter
  }

  // Only show the top priority insight to keep the UI premium and minimal
  const primaryInsight = insights[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-xl border border-brand-hairline bg-white shadow-sm overflow-hidden"
    >
      {/* Executive Summary Header */}
      <div className="bg-brand-surface-soft px-5 py-4 border-b border-brand-hairline flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-brand-ink" />
          <h2 className="text-sm font-semibold text-brand-ink">Strategic Readout</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className={cn("h-3.5 w-3.5", getHealthColor(ecosystemSummary.overallHealth))} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            Ecosystem {ecosystemSummary.overallHealth.replace("_", " ")}
          </span>
        </div>
      </div>
      
      <div className="px-5 py-4">
        <p className="text-[13px] text-brand-body leading-relaxed mb-4">
          {ecosystemSummary.executiveSummary}
        </p>

        {/* Primary Insight */}
        <div className="rounded-lg border border-brand-hairline bg-white p-4 relative group hover:border-brand-ink/20 transition-colors">
          <button 
            onClick={() => dismissInsight(primaryInsight.id)}
            className="absolute top-3 right-3 p-1 rounded-md text-brand-muted hover:bg-brand-surface-soft opacity-0 group-hover:opacity-100 transition-opacity"
            title="Dismiss insight"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-start gap-3">
            <div className={cn("p-1.5 rounded-md shrink-0", getCategoryBg(primaryInsight.category))}>
              {getCategoryIcon(primaryInsight.category)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-brand-ink">{primaryInsight.title}</h3>
                {primaryInsight.priority === "urgent" && (
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-brand-coral/10 text-brand-coral text-[9px] font-bold uppercase tracking-wider">Urgent</span>
                )}
              </div>
              
              <p className="text-xs text-brand-body leading-relaxed mb-3">
                {primaryInsight.description}
              </p>

              {/* Explainability Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-brand-surface-soft border border-brand-hairline text-[10px] text-brand-muted font-medium">
                  <span className="text-brand-ink font-semibold">{primaryInsight.confidence}%</span> confidence
                </div>
                {primaryInsight.signalsAnalyzed.map((signal, idx) => (
                  <div key={idx} className="px-1.5 py-0.5 rounded-[4px] bg-brand-surface-soft border border-brand-hairline text-[10px] text-brand-muted font-medium">
                    Signal: {signal}
                  </div>
                ))}
              </div>

              <div className="bg-brand-surface-soft rounded-md p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink mb-1">Actionable Advice</p>
                <p className="text-xs text-brand-body leading-relaxed">{primaryInsight.actionableAdvice}</p>
                
                {primaryInsight.relatedEntityUrl && (
                  <Link 
                    href={primaryInsight.relatedEntityUrl}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-brand-primary hover:underline"
                  >
                    Take Action
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getHealthColor(health: string) {
  switch (health) {
    case "excellent": return "text-brand-success";
    case "stable": return "text-brand-ink";
    case "at_risk": return "text-brand-warning";
    case "volatile": return "text-brand-coral";
    default: return "text-brand-muted";
  }
}

function getCategoryBg(category: string) {
  switch (category) {
    case "risk": return "bg-brand-coral/10 text-brand-coral";
    case "opportunity": return "bg-brand-success/10 text-brand-success";
    case "trust_growth": return "bg-yellow-500/10 text-yellow-600";
    default: return "bg-brand-surface-soft text-brand-ink";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "risk": return <AlertTriangle className="h-4 w-4" />;
    case "opportunity": return <Lightbulb className="h-4 w-4" />;
    case "market_trend": return <TrendingUp className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
}
