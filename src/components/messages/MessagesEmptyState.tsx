"use client";

import { MessageSquare } from "lucide-react";

export function MessagesEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-brand-surface-soft">
      <div className="grid h-14 w-14 place-items-center rounded-[12px] bg-white shadow-sm">
        <MessageSquare className="h-6 w-6 text-brand-muted" />
      </div>
      <p className="mt-4 text-sm font-medium text-brand-ink">Select a conversation</p>
      <p className="mt-1.5 max-w-[220px] text-center text-xs text-brand-muted">
        Choose a conversation from the list to start messaging.
      </p>
    </div>
  );
}
