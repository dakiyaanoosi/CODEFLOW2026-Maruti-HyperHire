"use client";

import * as React from "react";
import { Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHyperAIStore } from "@/store/use-hyperai-store";

export function FloatingAssistantButton() {
  const { toggleAssistant, isOpen, pageContext } = useHyperAIStore();
  const [hovered, setHovered] = React.useState(false);
  const [hasContext, setHasContext] = React.useState(false);

  // Show context dot when pageContext has been set (i.e. AI is context-loaded)
  React.useEffect(() => {
    setHasContext(!!pageContext && pageContext !== "/dashboard");
  }, [pageContext]);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
      {/* Hover label */}
      <AnimatePresence>
        {hovered && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-none flex items-center gap-1.5 rounded-[6px] bg-brand-ink px-3 py-1.5"
          >
            <Sparkles className="h-3 w-3 text-white" />
            <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-white">
              HyperAI
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <div className="relative flex items-center justify-center">
        {/* Ambient pulse rings — only visible when closed */}
        <motion.button
          id="hyperai-floating-btn"
          onClick={toggleAssistant}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileTap={{ scale: 0.93 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-brand-ink bg-brand-ink text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-info-border focus-visible:ring-offset-2"
          title={isOpen ? "Close HyperAI" : "Open HyperAI"}
          aria-label={isOpen ? "Close HyperAI assistant" : "Open HyperAI assistant"}
        >
          {/* Context-loaded notification dot */}
          {hasContext && !isOpen && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-mint border-2 border-white" />
            </span>
          )}

          {/* Icon */}
          <motion.div
            animate={isOpen ? { rotate: 90, scale: 0.88 } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {isOpen ? (
              <X className="h-5 w-5" strokeWidth={2.5} />
            ) : (
              <Sparkles className="h-5 w-5 text-white" />
            )}
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}
