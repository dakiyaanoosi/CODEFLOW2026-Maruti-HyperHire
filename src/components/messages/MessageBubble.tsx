"use client";

import * as React from "react";
import { Check, CheckCheck, FileText, ImageIcon, File } from "lucide-react";
import { Message } from "@/types/message";
import { formatMessageTime } from "@/lib/message-utils";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
}

export function MessageBubble({ message, isOwn, senderName }: MessageBubbleProps) {
  if (message.messageType === "system") {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-brand-muted bg-brand-surface-soft px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      {!isOwn && (
        <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface-strong text-[10px] font-semibold text-brand-ink">
          {senderName.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className={cn("flex max-w-[68%] flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {message.attachmentUrl && (
          <AttachmentChip 
            url={message.attachmentUrl} 
            type={message.attachmentType || "file"} 
            isOwn={isOwn} 
          />
        )}

        {message.content && message.content !== "Sent an attachment" && (
          <div
            className={cn(
              "rounded-[12px] px-3.5 py-2.5 text-sm leading-[1.5]",
              isOwn
                ? "rounded-br-[4px] bg-brand-ink text-white"
                : "rounded-bl-[4px] bg-brand-surface-soft text-brand-ink"
            )}
          >
            {message.content}
          </div>
        )}

        <div className={cn("flex items-center gap-1", isOwn ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[10px] text-brand-muted">{formatMessageTime(new Date(message.createdAt))}</span>
          {isOwn && <CheckCheck className="h-3 w-3 text-brand-link" />}
        </div>
      </div>
    </div>
  );
}

function AttachmentChip({ url, type, isOwn }: { url: string; type: string; isOwn: boolean }) {
  const Icon = type === "pdf" ? FileText : type === "image" ? ImageIcon : File;

  if (type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block max-w-[240px] overflow-hidden rounded-[10px] border border-brand-hairline">
        <img src={url} alt="Attachment" className="w-full h-auto object-cover" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] border px-3 py-2 transition-opacity hover:opacity-80",
        isOwn
          ? "border-white/20 bg-white/10 text-white"
          : "border-brand-hairline bg-white text-brand-ink"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="max-w-[180px] truncate text-xs font-medium">View File</p>
        <p className={cn("text-[10px]", isOwn ? "text-white/60" : "text-brand-muted")}>
          {type.toUpperCase()}
        </p>
      </div>
    </a>
  );
}
