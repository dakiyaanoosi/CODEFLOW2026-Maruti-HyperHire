"use client";

import * as React from "react";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { MessagesEmptyState } from "./MessagesEmptyState";
import { Conversation, Message } from "@/types/message";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "@/lib/message-utils";
import { cn } from "@/lib/utils";

interface MessagingPanelProps {
  currentUserId?: string;
  currentUserRole?: "student" | "business";
}

export function MessagingPanel({
  currentUserId = "current-user",
  currentUserRole = "student",
}: MessagingPanelProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messageMap, setMessageMap] = React.useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  const [mobileView, setMobileView] = React.useState<"list" | "chat">("list");
  const [isActuallyMobile, setIsActuallyMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsActuallyMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsActuallyMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;
  const activeMessages = activeConvId ? (messageMap[activeConvId] ?? []) : [];

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setMobileView("chat");

    if (conv.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  const handleSendMessage = (content: string) => {
    if (!activeConvId) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConvId,
      senderId: currentUserId,
      senderName: "You",
      senderRole: currentUserRole,
      content,
      attachments: [],
      status: "sending",
      createdAt: new Date(),
    };

    setMessageMap((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, lastMessage: content, lastMessageAt: new Date() }
          : c
      )
    );

    setTimeout(() => {
      setMessageMap((prev) => ({
        ...prev,
        [activeConvId]: (prev[activeConvId] ?? []).map((m) =>
          m.id === newMsg.id ? { ...m, status: "delivered" } : m
        ),
      }));
    }, 800);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-[12px] border border-brand-hairline bg-white shadow-sm">
      <div
        className={cn(
          "w-[300px] shrink-0",
          "hidden md:block",
          mobileView === "list" ? "block" : "hidden"
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelectConversation}
        />
      </div>

      <div
        className={cn(
          "flex-1",
          mobileView === "chat" ? "block" : "hidden md:block"
        )}
      >
        {activeConv ? (
          <ChatWindow
            conversation={activeConv}
            messages={activeMessages}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onSendMessage={handleSendMessage}
            onBack={() => setMobileView("list")}
            isMobile={isActuallyMobile}
          />
        ) : (
          <MessagesEmptyState />
        )}
      </div>
    </div>
  );
}
