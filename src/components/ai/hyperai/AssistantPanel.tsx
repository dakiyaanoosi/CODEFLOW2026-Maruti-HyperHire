"use client";

import * as React from "react";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { useAuthStore } from "@/store/use-auth-store";
import { ChatArea } from "./ChatArea";
import { InsightCards } from "./InsightCards";
import { QuickActions } from "./QuickActions";
import { ContextStatusBar } from "./ContextStatusBar";
import {
  Sparkles,
  Trash2,
  X,
  SendHorizontal,
  BrainCircuit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AssistantPanel() {
  const {
    isOpen,
    closeAssistant,
    sendMessage,
    clearHistory,
    isLoading,
    userRole,
  } = useHyperAIStore();
  const { profile } = useAuthStore();
  const [inputVal, setInputVal] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    sendMessage(inputVal.trim());
    setInputVal("");
  };

  // Auto-focus input when panel opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const isStudent = profile?.role !== "business";
  const roleName = isStudent ? "Career Growth AI" : "Hiring Intelligence";
  const roleSub = isStudent
    ? "Profile · Portfolio · Match Analysis"
    : "Candidates · Gigs · Hiring Pipeline";
  const inputPlaceholder = isStudent
    ? "Ask about match scores, skills, profile improvements..."
    : "Ask about candidates, gig optimization, hiring pipeline...";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeAssistant}
            className="fixed inset-0 z-40 bg-brand-ink/20 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260, mass: 0.8 }}
            className="fixed top-0 right-0 z-50 flex h-screen w-full max-w-[440px] flex-col border-l border-brand-hairline bg-white shadow-2xl"
          >
            {/* ── Header ─────────────────────────────────────── */}
            <div className="shrink-0 bg-brand-ink px-5 py-4">
              <div className="flex items-start justify-between">
                {/* Brand identity */}
                <div className="flex items-center gap-3">
                  {/* AI icon */}
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
                    <BrainCircuit className="h-4.5 w-4.5 text-brand-mint" />
                    {/* Pulse ring */}
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand-mint/20 opacity-75" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-white leading-none tracking-tight">
                        HyperAI
                      </h2>
                      {/* Live badge */}
                      <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-mint animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-brand-mint">
                          Live
                        </span>
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] font-medium text-white/50 uppercase tracking-wider">
                      {roleName}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearHistory}
                    title="Reset conversation"
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={closeAssistant}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Role capabilities sub-line */}
              <p className="mt-3 text-[11px] text-white/35 font-medium leading-none">
                {roleSub}
              </p>
            </div>

            {/* ── Context Status Bar ──────────────────────────── */}
            <ContextStatusBar />

            {/* ── Chat Area ───────────────────────────────────── */}
            <ChatArea />

            {/* ── Bottom Tray: Insights + Quick Actions ───────── */}
            <div className="shrink-0 border-t border-brand-hairline bg-brand-surface-soft/70 px-4 py-3.5 space-y-3.5 max-h-[260px] overflow-y-auto">
              <InsightCards />
              <QuickActions />
            </div>

            {/* ── Input Bar ───────────────────────────────────── */}
            <div className="shrink-0 border-t border-brand-hairline bg-white px-4 py-3.5">
              <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Sparkles className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted/60" />
                  <input
                    ref={inputRef}
                    id="hyperai-input"
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    disabled={isLoading}
                    placeholder={inputPlaceholder}
                    className="w-full rounded-[8px] border border-brand-hairline bg-brand-surface-soft py-2.5 pl-8 pr-3 text-xs text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-border-strong focus:bg-white focus:outline-none disabled:opacity-50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  id="hyperai-send-btn"
                  disabled={!inputVal.trim() || isLoading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-brand-ink text-white shadow-sm transition-colors hover:bg-brand-primary-active disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Footer attribution */}
              <p className="mt-2 text-center text-[9px] font-medium uppercase tracking-widest text-brand-muted/50">
                Powered by HyperHire AI Engine
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
