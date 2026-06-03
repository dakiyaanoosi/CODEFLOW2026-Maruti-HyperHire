export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export type AttachmentType = "image" | "pdf" | "doc" | "file";

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: AttachmentType;
}

export interface Message {
  messageId: string;
  conversationId: string;
  collaborationId: string;
  senderId: string;
  senderRole: "student" | "business";
  content: string;
  messageType?: "text" | "attachment" | "system";
  attachmentUrl?: string;
  attachmentType?: AttachmentType;
  readBy: string[]; // array of userIds
  createdAt: string;

  contextType?:
    | "general"
    | "task"
    | "milestone"
    | "deliverable"
    | "review"
    | "escrow";
  contextId?: string;
  attachments?: string[];
  systemGenerated?: boolean;
}

export interface Conversation {
  conversationId: string;
  participantIds: string[];
  participantRoles: Record<string, "student" | "business">;
  participantNames: Record<string, string>; // for quick display without joins
  participantInitials: Record<string, string>; // for quick display without joins
  relatedJobId?: string;
  relatedApplicationId?: string;
  collaborationId?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCounts: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  updatedAt: string;
}

export interface AiQuickReply {
  id: string;
  label: string;
  content: string;
}
