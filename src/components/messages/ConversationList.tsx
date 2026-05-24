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
  currentUserId: string;
}

export function ConversationList({ conversations, activeId, onSelect, currentUserId }: ConversationListProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const otherParticipantId = c.participantIds.find(id => id !== currentUserId) || currentUserId;
      const otherName = c.participantNames[otherParticipantId] || "Unknown";
      
      return (
        otherName.toLowerCase().includes(q) ||
        c.relatedJobId?.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [conversations, search, currentUserId]);

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
              key={conv.conversationId}
              conversation={conv}
              isActive={conv.conversationId === activeId}
              onSelect={onSelect}
              currentUserId={currentUserId}
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
  currentUserId,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conv: Conversation) => void;
  currentUserId: string;
}) {
  const otherParticipantId = conversation.participantIds.find(id => id !== currentUserId) || currentUserId;
  const participantName = conversation.participantNames[otherParticipantId] || "Unknown";
  const participantInitials = conversation.participantInitials[otherParticipantId] || "U";
  const unreadCount = conversation.unreadCounts?.[currentUserId] || 0;

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
          {participantInitials}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-sm font-medium text-brand-ink">{participantName}</span>
          <span className="shrink-0 text-[11px] text-brand-muted">{formatMessageTime(new Date(conversation.lastMessageAt))}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <p className={cn(
            "truncate text-xs", 
            unreadCount > 0 ? "text-brand-ink font-medium" : "text-brand-muted"
          )}>
            {conversation.lastMessage}
          </p>
          {unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
