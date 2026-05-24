"use client";

import * as React from "react";
import { Check, CheckCheck, FileText, ImageIcon, File } from "lucide-react";
import { Message, Attachment } from "@/types/message";
import { formatMessageTime, formatFileSize } from "@/lib/message-utils";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      {!isOwn && (
        <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface-strong text-[10px] font-semibold text-brand-ink">
          {message.senderName.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className={cn("flex max-w-[68%] flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {message.attachments.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {message.attachments.map((att) => (
              <AttachmentChip key={att.id} attachment={att} isOwn={isOwn} />
            ))}
          </div>
        )}

        {message.content && (
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
          <span className="text-[10px] text-brand-muted">{formatMessageTime(message.createdAt)}</span>
          {isOwn && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: Message["status"] }) {
  if (status === "sending") return <span className="h-3 w-3 animate-pulse rounded-full bg-brand-muted opacity-50" />;
  if (status === "sent") return <Check className="h-3 w-3 text-brand-muted" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-brand-muted" />;
  return <CheckCheck className="h-3 w-3 text-brand-link" />;
}

function AttachmentChip({ attachment, isOwn }: { attachment: Attachment; isOwn: boolean }) {
  const Icon = attachment.type === "pdf" ? FileText : attachment.type === "image" ? ImageIcon : File;

  return (
    <a
      href={attachment.url}
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
        <p className="max-w-[180px] truncate text-xs font-medium">{attachment.name}</p>
        <p className={cn("text-[10px]", isOwn ? "text-white/60" : "text-brand-muted")}>
          {formatFileSize(attachment.size)}
        </p>
      </div>
    </a>
  );
}
