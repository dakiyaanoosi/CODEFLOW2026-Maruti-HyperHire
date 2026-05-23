"use client";

import * as React from "react";
import { useUIStore } from "@/store/use-ui-store";
import { useAuthStore } from "@/store/use-auth-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sparkles, X, TrendingUp, Zap, Target, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SUGGESTED_ACTIONS = [
  {
    icon: Target,
    title: "Review 3 job matches",
    desc: "High-compatibility talent waiting for review",
    accent: "bg-brand-peach",
  },
  {
    icon: Zap,
    title: "Finalize pending pitch",
    desc: "2 proposals drafted — ready to submit",
    accent: "bg-brand-mint",
  },
  {
    icon: TrendingUp,
    title: "Check skill demand spike",
    desc: "Video editing +32% this week in your area",
    accent: "bg-brand-yellow",
  },
];

const AI_INSIGHTS = [
  { label: "Active jobs", value: "—" },
  { label: "Match score avg", value: "—" },
  { label: "Pending actions", value: "—" },
];

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1 w-1 rounded-full bg-white/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export function RightPanel() {
  const { isRightPanelOpen, setRightPanelOpen } = useUIStore();
  const { profile } = useAuthStore();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2200);
  };

  const greeting = profile?.name
    ? `Hi ${profile.name.split(" ")[0]}, here's your workspace brief.`
    : "Here's your workspace intelligence brief.";

  return (
    <AnimatePresence>
      {isRightPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="hidden h-screen shrink-0 select-none overflow-hidden border-l border-brand-hairline bg-white xl:flex xl:flex-col"
          style={{ minWidth: 0 }}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-brand-hairline px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-brand-ink">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-brand-ink">AI Copilot</span>
              <span className="rounded-full bg-brand-mint px-1.5 py-0.5 text-[10px] font-semibold text-brand-ink">
                Live
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-brand-muted hover:text-brand-ink"
              onClick={() => setRightPanelOpen(false)}
              aria-label="Close AI panel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {/* AI Hero card */}
              <div className="rounded-[10px] bg-brand-ink p-4 text-white">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/10">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                      Workspace Intelligence
                    </p>
                    <p className="text-sm leading-[1.6] text-white/85">{greeting}</p>
                    <p className="mt-2 text-xs leading-[1.6] text-white/60">
                      Demand is strongest for short-form video, landing page copy, and event design tasks this week.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  className={cn(
                    "mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-[8px] bg-white/10 text-xs font-semibold text-white transition-colors hover:bg-white/15 active:bg-white/20",
                    isGenerating && "pointer-events-none opacity-80"
                  )}
                >
                  {isGenerating ? (
                    <>
                      Generating plan <TypingDots />
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      Generate action plan
                    </>
                  )}
                </button>
              </div>

              {/* Quick stats */}
              <div className="rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
                  Today&apos;s snapshot
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {AI_INSIGHTS.map(({ label, value }) => (
                    <div key={label} className="rounded-[8px] bg-white p-2.5 text-center ring-1 ring-brand-hairline">
                      <p className="text-base font-semibold text-brand-ink leading-none">{value}</p>
                      <p className="mt-1 text-[10px] text-brand-muted leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested actions */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Suggested actions
                </p>
                <div className="space-y-2">
                  {SUGGESTED_ACTIONS.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <motion.div
                        key={action.title}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.2 }}
                        className="group flex cursor-pointer items-start gap-3 rounded-[10px] border border-brand-hairline bg-white p-3 transition-colors hover:border-brand-border-strong"
                      >
                        <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]", action.accent)}>
                          <Icon className="h-3.5 w-3.5 text-brand-ink" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-brand-ink">{action.title}</p>
                          <p className="mt-0.5 text-xs text-brand-muted leading-[1.4]">{action.desc}</p>
                        </div>
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-muted opacity-0 transition-opacity group-hover:opacity-100" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* AI Brief footer */}
              <div className="rounded-[10px] border border-brand-hairline bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                  Market signals
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Video Editing", trend: "+32%", color: "text-brand-success" },
                    { label: "Graphic Design", trend: "+18%", color: "text-brand-success" },
                    { label: "Social Media", trend: "+11%", color: "text-brand-muted" },
                  ].map(({ label, trend, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-brand-body">{label}</span>
                      <span className={cn("text-xs font-semibold", color)}>{trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
