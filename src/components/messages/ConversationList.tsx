"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Conversation } from "@/types/message";
import { formatMessageTime } from "@/lib/message-utils";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conv: Conversation) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.participantName.toLowerCase().includes(q) ||
        c.jobTitle?.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  return (
    <div className="flex h-full flex-col border-r border-brand-hairline bg-white">
      <div className="border-b border-brand-hairline px-4 py-4">
        <h2 className="text-[18px] font-medium leading-[1.4] text-brand-ink">Messages</h2>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-[6px] border border-brand-hairline bg-brand-surface-soft pl-9 pr-3 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-info-border focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-brand-muted">No conversations found.</p>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conv: Conversation) => void;
}) {
  return (
    <button
      onClick={() => onSelect(conversation)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
        isActive ? "bg-brand-surface-soft" : "hover:bg-brand-surface-soft"
      )}
    >
      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white">
          {conversation.participantInitials}
        </div>
        {conversation.isOnline && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-success" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-sm font-medium text-brand-ink">{conversation.participantName}</span>
          <span className="shrink-0 text-[11px] text-brand-muted">{formatMessageTime(conversation.lastMessageAt)}</span>
        </div>
        {conversation.jobTitle && (
          <span className="text-[11px] text-brand-link">{conversation.jobTitle}</span>
        )}
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <p className="truncate text-xs text-brand-muted">{conversation.lastMessage}</p>
          {conversation.unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-ink px-1 text-[10px] font-semibold text-white">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
