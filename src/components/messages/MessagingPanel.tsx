"use client";

import * as React from "react";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { MessagesEmptyState } from "./MessagesEmptyState";
import { Conversation, Message } from "@/types/message";
import { messageService } from "@/lib/message-service";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

export function MessagingPanel() {
  const { user, profile } = useAuthStore();
  const currentUserId = user?.uid || "current-user";
  const currentUserRole = profile?.role || "student";

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  const [mobileView, setMobileView] = React.useState<"list" | "chat">("list");
  const [isActuallyMobile, setIsActuallyMobile] = React.useState(false);

  // Responsive logic
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsActuallyMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsActuallyMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Real-time conversations
  React.useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = messageService.subscribeToConversations(currentUserId, (convos) => {
      setConversations(convos);
    });
    return () => unsubscribe();
  }, [currentUserId]);

  // Real-time messages for active conversation
  React.useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    const unsubscribe = messageService.subscribeToMessages(activeConvId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [activeConvId]);

  const activeConv = conversations.find((c) => c.conversationId === activeConvId) ?? null;

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConvId(conv.conversationId);
    setMobileView("chat");

    if (conv.unreadCounts && conv.unreadCounts[currentUserId] > 0) {
      messageService.markAsRead(conv.conversationId, currentUserId).catch(console.error);
    }
  };

  const handleSendMessage = async (content: string, attachmentUrl?: string, attachmentType?: any) => {
    if (!activeConvId) return;

    try {
      await messageService.sendMessage(
        activeConvId,
        currentUserId,
        currentUserRole as any,
        content,
        attachmentUrl,
        attachmentType
      );
    } catch (error) {
      console.error("Failed to send message:", error);
    }
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
          currentUserId={currentUserId}
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
            messages={messages}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole as any}
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
