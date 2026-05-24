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
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "student" | "business";
  content: string;
  attachments: Attachment[];
  status: MessageStatus;
  createdAt: Date;
  isAiSuggestion?: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: "student" | "business";
  participantInitials: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isOnline: boolean;
  jobTitle?: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface AiQuickReply {
  id: string;
  label: string;
  content: string;
}
