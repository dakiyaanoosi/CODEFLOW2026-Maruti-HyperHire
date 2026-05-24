"use client";

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface-strong text-[10px] font-semibold text-brand-ink">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex items-center gap-1 rounded-[12px] rounded-bl-[4px] bg-brand-surface-soft px-3.5 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted [animation-delay:300ms]" />
      </div>
      <span className="mb-1 text-[10px] text-brand-muted">{name} is typing…</span>
    </div>
  );
}
