"use client";

import * as React from "react";
import { Paperclip, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onToggleAi: () => void;
  showAi: boolean;
  disabled?: boolean;
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  onAttach,
  onToggleAi,
  showAi,
  disabled,
}: MessageComposerProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  };

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <div className="border-t border-brand-hairline bg-white px-4 py-3">
      <div className="flex items-end gap-2 rounded-[10px] border border-brand-hairline bg-brand-surface-soft px-3 py-2">
        <button
          onClick={onAttach}
          className="mb-0.5 shrink-0 rounded p-1 text-brand-muted transition-colors hover:text-brand-ink"
          aria-label="Attach file"
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm leading-[1.5] text-brand-ink placeholder:text-brand-muted focus:outline-none disabled:opacity-40"
        />

        <div className="mb-0.5 flex shrink-0 items-center gap-1">
          <button
            onClick={onToggleAi}
            className={cn(
              "rounded p-1 transition-colors",
              showAi ? "text-brand-mustard" : "text-brand-muted hover:text-brand-ink"
            )}
            aria-label="Toggle AI replies"
            disabled={disabled}
          >
            <Sparkles className="h-4 w-4" />
          </button>

          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-brand-ink text-white transition-opacity hover:opacity-80 disabled:opacity-30"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-brand-muted">Shift + Enter for new line</p>
    </div>
  );
}
