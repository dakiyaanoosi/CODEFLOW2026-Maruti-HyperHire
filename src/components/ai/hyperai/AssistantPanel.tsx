"use client";

import * as React from "react";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import { useAuthStore } from "@/store/use-auth-store";
import { ChatArea } from "./ChatArea";
import { InsightCards } from "./InsightCards";
import { QuickActions } from "./QuickActions";
import { ContextStatusBar } from "./ContextStatusBar";
import {
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
            className="fixed inset-0 z-40 bg-brand-ink/20"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260, mass: 0.8 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[440px] flex-col border-l border-brand-hairline bg-white"
          >
            {/* ── Header ─────────────────────────────────────── */}
            <div className="shrink-0 bg-brand-ink px-5 py-4 text-white">
              <div className="flex items-start justify-between">
                {/* Brand identity */}
                <div className="flex items-center gap-3">
                  {/* AI icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
                    <BrainCircuit className="h-4 w-4 text-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-medium leading-none">
                        HyperAI
                      </h2>
                      {/* Live badge */}
                      <span className="flex items-center gap-1 rounded-[6px] bg-white/10 px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-mint" />
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/75">
                          Live
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/55">
                      {roleName}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearHistory}
                    title="Reset conversation"
                    className="flex h-8 w-8 items-center justify-center rounded-[6px] text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={closeAssistant}
                    className="flex h-8 w-8 items-center justify-center rounded-[6px] text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Role capabilities sub-line */}
              <p className="mt-3 text-[11px] font-medium leading-none text-white/45">
                {roleSub}
              </p>
            </div>

            {/* ── Context Status Bar ──────────────────────────── */}
            <ContextStatusBar />

            {/* ── Chat Area ───────────────────────────────────── */}
            <ChatArea />

            {/* ── Bottom Tray: Insights + Quick Actions ───────── */}
            <div className="shrink-0 max-h-[260px] space-y-3.5 overflow-y-auto border-t border-brand-hairline bg-brand-surface-soft px-4 py-3.5">
              <InsightCards />
              <QuickActions />
            </div>

            {/* ── Input Bar ───────────────────────────────────── */}
            <div className="shrink-0 border-t border-brand-hairline bg-white px-4 py-3.5">
              <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id="hyperai-input"
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    disabled={isLoading}
                    placeholder={inputPlaceholder}
                    className="h-11 w-full rounded-[6px] border border-brand-hairline bg-white px-4 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-info-border focus:outline-none disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  id="hyperai-send-btn"
                  disabled={!inputVal.trim() || isLoading}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brand-ink text-white transition-colors hover:bg-brand-primary-active disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Footer attribution */}
              <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-brand-muted">
                Powered by HyperHire AI Engine
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
