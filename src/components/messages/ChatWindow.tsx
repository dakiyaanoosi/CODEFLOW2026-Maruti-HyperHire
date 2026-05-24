"use client";

import * as React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Conversation, Message } from "@/types/message";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { AiQuickReplies } from "./AiQuickReplies";
import { getContextualSuggestions } from "@/lib/message-utils";
import { uploadFile } from "@/lib/cloudinary";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  currentUserRole: "student" | "business";
  onSendMessage: (content: string, attachmentUrl?: string, attachmentType?: string) => Promise<void>;
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
  
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isUploading]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    setShowAi(false);
    await onSendMessage(content);
  };

  const handleAiReply = (content: string) => {
    setDraft(content);
    setShowAi(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await uploadFile(file, (p) => setUploadProgress(p));
      
      let type = "file";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type === "application/pdf") type = "pdf";

      await onSendMessage(file.name || "Attachment", result.url, type);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload attachment");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const otherParticipantId = conversation.participantIds.find(id => id !== currentUserId) || currentUserId;
  const participantName = conversation.participantNames[otherParticipantId] || "Unknown";
  const participantInitials = conversation.participantInitials[otherParticipantId] || "U";

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-brand-hairline px-4 py-3.5 shadow-sm z-10">
        {isMobile && onBack && (
          <button onClick={onBack} className="mr-1 rounded p-1 text-brand-muted hover:text-brand-ink">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white">
            {participantInitials}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-ink">{participantName}</p>
          {conversation.relatedJobId && (
            <p className="text-[11px] text-brand-muted truncate">
              Job ref: {conversation.relatedJobId}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 bg-brand-surface-soft/30">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            const senderName = isOwn ? "You" : (conversation.participantNames[msg.senderId] || "Unknown");
            return (
              <motion.div
                key={msg.messageId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                <MessageBubble message={msg} isOwn={isOwn} senderName={senderName} />
              </motion.div>
            );
          })}

          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs font-medium text-brand-muted self-end mr-2"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading attachment... {uploadProgress}%
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
              replies={getContextualSuggestions(
                currentUserRole,
                conversation,
                messages[messages.length - 1]
              ).replies}
              suggestions={getContextualSuggestions(
                currentUserRole,
                conversation,
                messages[messages.length - 1]
              ).suggestions}
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
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
      />
    </div>
  );
}
