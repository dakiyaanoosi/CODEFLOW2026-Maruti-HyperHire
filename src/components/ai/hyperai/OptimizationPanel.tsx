"use client";

import * as React from "react";
import { OptimizationAnalysis } from "@/types/optimization";
import { BrainCircuit, TrendingUp, AlertCircle, Lightbulb, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OptimizationPanelProps {
  analysis: OptimizationAnalysis | null;
  isAnalyzing: boolean;
  type: "proposal" | "gig";
}

export function OptimizationPanel({ analysis, isAnalyzing, type }: OptimizationPanelProps) {
  const [expanded, setExpanded] = React.useState(true);

  if (!analysis && !isAnalyzing) return null;

  return (
    <div className="mt-4 border border-brand-hairline rounded-xl bg-white overflow-hidden shadow-sm transition-all">
      {/* Header */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-brand-surface-soft hover:bg-brand-surface transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className={cn("h-4 w-4", isAnalyzing ? "text-brand-primary animate-pulse" : "text-brand-ink")} />
          <span className="text-sm font-medium text-brand-ink">
            {type === "proposal" ? "Strategic Proposal Coach" : "Gig Attraction Optimizer"}
          </span>
          {isAnalyzing && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted ml-2 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Analyzing semantics...
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {analysis && !isAnalyzing && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-brand-muted">Overall Score</span>
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-sm font-medium",
                  analysis.scores.overall >= 80 ? "text-brand-success" : 
                  analysis.scores.overall >= 60 ? "text-brand-warning" : "text-brand-coral"
                )}>
                  {analysis.scores.overall} / 100
                </span>
                {analysis.previousOverallScore && analysis.scores.overall > analysis.previousOverallScore && (
                  <TrendingUp className="h-3 w-3 text-brand-success" />
                )}
              </div>
            </div>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-brand-muted" /> : <ChevronDown className="h-4 w-4 text-brand-muted" />}
        </div>
      </button>

      {/* Body */}
      <AnimatePresence>
        {expanded && analysis && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-brand-hairline"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Metrics & Confidence */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-brand-muted mb-3">Multi-Dimensional Analysis</h4>
                  <div className="space-y-3">
                    <ScoreBar label="Semantic Relevance" score={analysis.scores.relevance} />
                    <ScoreBar label="Clarity & Detail" score={analysis.scores.clarity} />
                    <ScoreBar label="Market Competitiveness" score={analysis.scores.marketCompetitiveness} />
                    <ScoreBar label="Trust Compatibility" score={analysis.scores.trustCompatibility} />
                  </div>
                </div>

                <div className="bg-brand-surface-soft rounded-lg p-3 border border-brand-hairline">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-medium text-brand-ink">AI Confidence: {analysis.confidence}%</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-brand-success">Top {analysis.percentile}%</span>
                  </div>
                  <p className="text-[11px] text-brand-body italic">
                    "{analysis.confidenceReasoning}"
                  </p>
                </div>
              </div>

              {/* Right Column: Weaknesses & Strategic Insights */}
              <div className="space-y-5">
                {analysis.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-brand-coral mb-3 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Semantic Weaknesses
                    </h4>
                    <div className="space-y-2">
                      {analysis.weaknesses.map((w, idx) => (
                        <div key={idx} className="bg-brand-coral/5 border border-brand-coral/20 rounded-md p-2">
                          <p className="text-[11px] text-brand-ink font-medium mb-1">
                            "<span className="bg-brand-coral/20 px-1 rounded">{w.phrase}</span>"
                          </p>
                          <p className="text-[10px] text-brand-coral mb-1">{w.reason}</p>
                          <p className="text-[10px] text-brand-ink font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-brand-success" /> {w.suggestedFix}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.insights.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-brand-primary mb-3 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" /> Strategic Insights
                    </h4>
                    <div className="space-y-2">
                      {analysis.insights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-brand-surface-soft p-2 rounded-md">
                          <div className={cn(
                            "mt-0.5 w-1.5 h-1.5 rounded-full shrink-0",
                            insight.type === "trust_impact" ? "bg-yellow-500" :
                            insight.type === "market_trend" ? "bg-brand-primary" : "bg-brand-success"
                          )} />
                          <p className="text-[11px] text-brand-body leading-tight">
                            {insight.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.weaknesses.length === 0 && analysis.scores.overall > 85 && (
                  <div className="flex items-center gap-2 bg-brand-success/10 text-brand-success p-3 rounded-md border border-brand-success/20">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-medium">This is highly optimized and ready to convert!</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string, score: number }) {
  const colorClass = score >= 80 ? "bg-brand-success" : score >= 60 ? "bg-brand-warning" : "bg-brand-coral";
  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <span className="text-[11px] font-medium text-brand-body">{label}</span>
        <span className="text-[10px] font-medium text-brand-ink">{score} / 100</span>
      </div>
      <div className="h-1.5 w-full bg-brand-hairline rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500 ease-out", colorClass)} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
