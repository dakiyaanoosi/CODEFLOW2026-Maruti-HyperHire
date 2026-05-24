"use client";

import * as React from "react";
import { Cpu, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AISkeletonLoaderProps {
  message?: string;
}

const CYCLING_MESSAGES = [
  "Analyzing semantic descriptions...",
  "Loading vector space coordinates...",
  "Computing cosine similarity matrix...",
  "Evaluating required skills overlap...",
  "Running portfolio tag analysis...",
  "Applying multi-factor weighting layers...",
  "Synthesizing explainable AI reasoning...",
];

export function AISkeletonLoader({ message }: AISkeletonLoaderProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % CYCLING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const displayMessage = message || CYCLING_MESSAGES[index];

  return (
    <div className="rounded-[12px] border border-brand-hairline bg-white p-6 space-y-5 relative overflow-hidden">
      {/* Decorative skeleton scanner */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-surface-soft/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      
      {/* Sparkles / CPU icon loader */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-surface-soft border border-brand-hairline">
          <Cpu className="h-5 w-5 text-brand-ink animate-spin" style={{ animationDuration: "4s" }} />
          <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-brand-yellow animate-pulse" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-3 w-1/3 rounded-md bg-brand-surface-strong" />
          <div className="h-2 w-1/4 rounded-md bg-brand-surface-strong/60" />
        </div>
      </div>

      <div className="border-t border-brand-hairline/60" />

      {/* Skeletons */}
      <div className="space-y-3">
        <div className="h-2.5 w-full rounded-md bg-brand-surface-strong/50" />
        <div className="h-2.5 w-5/6 rounded-md bg-brand-surface-strong/50" />
        <div className="h-2.5 w-4/6 rounded-md bg-brand-surface-strong/50" />
      </div>

      {/* Cycling Inference Text */}
      <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-brand-muted">
        <span className="flex h-1.5 w-1.5 rounded-full bg-brand-peach animate-ping" />
        <AnimatePresence mode="wait">
          <motion.span
            key={displayMessage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {displayMessage}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
