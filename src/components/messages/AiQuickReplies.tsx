"use client";

import * as React from "react";
import { Sparkles, X } from "lucide-react";
import { AiQuickReply } from "@/types/message";
import { cn } from "@/lib/utils";

interface AiQuickRepliesProps {
  replies: AiQuickReply[];
  suggestions: string[];
  onSelectReply: (content: string) => void;
  onDismiss: () => void;
}

export function AiQuickReplies({ replies, suggestions, onSelectReply, onDismiss }: AiQuickRepliesProps) {
  return (
    <div className="border-t border-brand-hairline bg-brand-surface-soft px-4 py-3">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-brand-mustard" />
          <span className="text-xs font-medium text-brand-ink">AI Quick Replies</span>
        </div>
        <button
          onClick={onDismiss}
          className="rounded p-0.5 text-brand-muted transition-colors hover:text-brand-ink"
          aria-label="Dismiss AI replies"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {replies.map((reply) => (
          <button
            key={reply.id}
            onClick={() => onSelectReply(reply.content)}
            className="rounded-[6px] border border-brand-hairline bg-white px-2.5 py-1 text-xs font-medium text-brand-ink transition-colors hover:border-brand-ink hover:bg-brand-ink hover:text-white"
          >
            {reply.label}
          </button>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-brand-muted">Smart Suggestions</p>
          <div className="flex flex-col gap-1">
            {suggestions.slice(0, 2).map((s, i) => (
              <button
                key={i}
                onClick={() => onSelectReply(s)}
                className={cn(
                  "flex items-start gap-2 rounded-[6px] border border-brand-hairline bg-white px-2.5 py-1.5 text-left text-xs text-brand-body transition-colors hover:border-brand-ink hover:text-brand-ink"
                )}
              >
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand-mustard" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
