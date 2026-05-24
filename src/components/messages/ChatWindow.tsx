"use client";

import * as React from "react";
import { ArrowLeft, Circle } from "lucide-react";
import { Conversation, Message } from "@/types/message";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageComposer } from "./MessageComposer";
import { AiQuickReplies } from "./AiQuickReplies";
import { AI_QUICK_REPLIES, AI_SUGGESTIONS } from "@/lib/message-utils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  currentUserRole: "student" | "business";
  onSendMessage: (content: string) => void;
  onBack?: () => void;
  isMobile?: boolean;
}

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  currentUserRole,
  onSendMessage,
  onBack,
  isMobile,
}: ChatWindowProps) {
  const [draft, setDraft] = React.useState("");
  const [showAi, setShowAi] = React.useState(false);
  const [isTypingSimulated, setIsTypingSimulated] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTypingSimulated]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;
    onSendMessage(content);
    setDraft("");
    setShowAi(false);

    setIsTypingSimulated(true);
    const delay = 1200 + Math.random() * 800;
    setTimeout(() => setIsTypingSimulated(false), delay);
  };

  const handleAiReply = (content: string) => {
    setDraft(content);
    setShowAi(false);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-brand-hairline px-4 py-3.5">
        {isMobile && onBack && (
          <button onClick={onBack} className="mr-1 rounded p-1 text-brand-muted hover:text-brand-ink">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white">
            {conversation.participantInitials}
          </div>
          {conversation.isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-success" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-ink">{conversation.participantName}</p>
          <p className="text-[11px] text-brand-muted">
            {conversation.isOnline ? "Online" : "Offline"}{conversation.jobTitle ? ` · ${conversation.jobTitle}` : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageBubble message={msg} isOwn={msg.senderId === currentUserId} />
            </motion.div>
          ))}

          <AnimatePresence>
            {isTypingSimulated && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <TypingIndicator name={conversation.participantName.split(" ")[0]} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div ref={bottomRef} />
      </div>

      <AnimatePresence>
        {showAi && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <AiQuickReplies
              replies={AI_QUICK_REPLIES}
              suggestions={AI_SUGGESTIONS[currentUserRole] ?? []}
              onSelectReply={handleAiReply}
              onDismiss={() => setShowAi(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <MessageComposer
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        onAttach={() => fileInputRef.current?.click()}
        onToggleAi={() => setShowAi((v) => !v)}
        showAi={showAi}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          console.info("File selected:", e.target.files);
        }}
      />
    </div>
  );
}
