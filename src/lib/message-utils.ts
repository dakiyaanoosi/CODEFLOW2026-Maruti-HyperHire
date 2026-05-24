import { Conversation, Message, AiQuickReply } from "@/types/message";

export function formatMessageTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    participantId: "user-2",
    participantName: "TechVision Labs",
    participantRole: "business",
    participantInitials: "TL",
    lastMessage: "We'd love to schedule a technical interview next week.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 12),
    unreadCount: 2,
    isOnline: true,
    jobTitle: "Frontend Engineer Intern",
  },
  {
    id: "conv-2",
    participantId: "user-3",
    participantName: "Hassan",
    participantRole: "student",
    participantInitials: "AP",
    lastMessage: "Thank you for the opportunity!",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unreadCount: 0,
    isOnline: true,
    jobTitle: "UX Design Intern",
  },
  {
    id: "conv-3",
    participantId: "user-4",
    participantName: "NovaBuild Co.",
    participantRole: "business",
    participantInitials: "NB",
    lastMessage: "Please share your portfolio when you get a chance.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    unreadCount: 1,
    isOnline: false,
    jobTitle: "Full Stack Developer",
  },
  {
    id: "conv-4",
    participantId: "user-5",
    participantName: "Marcus Chen",
    participantRole: "student",
    participantInitials: "MC",
    lastMessage: "I've submitted the assessment.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unreadCount: 0,
    isOnline: false,
    jobTitle: "Data Science Intern",
  },
  {
    id: "conv-5",
    participantId: "user-6",
    participantName: "Vertex Systems",
    participantRole: "business",
    participantInitials: "VS",
    lastMessage: "Offer letter has been sent to your email.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    unreadCount: 0,
    isOnline: false,
    jobTitle: "Backend Engineer",
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "user-2",
      senderName: "TechVision Labs",
      senderRole: "business",
      content: "Hi! We reviewed your application for the Frontend Engineer Intern role. Your portfolio is impressive.",
      attachments: [],
      status: "read",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      senderId: "current-user",
      senderName: "You",
      senderRole: "student",
      content: "Thank you so much! I'm really excited about this opportunity at TechVision Labs.",
      attachments: [],
      status: "read",
      createdAt: new Date(Date.now() - 1000 * 60 * 90),
    },
    {
      id: "msg-3",
      conversationId: "conv-1",
      senderId: "user-2",
      senderName: "TechVision Labs",
      senderRole: "business",
      content: "We'd like to see your resume and any recent projects. Could you share those?",
      attachments: [],
      status: "read",
      createdAt: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      id: "msg-4",
      conversationId: "conv-1",
      senderId: "current-user",
      senderName: "You",
      senderRole: "student",
      content: "Of course! Here's my latest resume.",
      attachments: [
        {
          id: "att-1",
          name: "resume_2026.pdf",
          url: "#",
          size: 245000,
          type: "pdf",
        },
      ],
      status: "read",
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "msg-5",
      conversationId: "conv-1",
      senderId: "user-2",
      senderName: "TechVision Labs",
      senderRole: "business",
      content: "We'd love to schedule a technical interview next week.",
      attachments: [],
      status: "delivered",
      createdAt: new Date(Date.now() - 1000 * 60 * 12),
    },
  ],
  "conv-2": [
    {
      id: "msg-6",
      conversationId: "conv-2",
      senderId: "current-user",
      senderName: "You",
      senderRole: "business",
      content: "Hi Hassan, we've reviewed your application for the UX Design Intern position.",
      attachments: [],
      status: "read",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: "msg-7",
      conversationId: "conv-2",
      senderId: "user-3",
      senderName: "Hassan",
      senderRole: "student",
      content: "Thank you for the opportunity!",
      attachments: [],
      status: "read",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ],
};

export const AI_QUICK_REPLIES: AiQuickReply[] = [
  { id: "qr-1", label: "Schedule interview", content: "I'd be happy to schedule an interview. What time slots work best for you next week?" },
  { id: "qr-2", label: "Request portfolio", content: "Could you please share your portfolio or recent project samples?" },
  { id: "qr-3", label: "Thank you", content: "Thank you for reaching out! I'll review your application and get back to you shortly." },
  { id: "qr-4", label: "Share availability", content: "I'm available Monday through Friday, 9 AM – 5 PM. Feel free to suggest a time that works for you." },
];

export const AI_SUGGESTIONS: Record<string, string[]> = {
  business: [
    "Schedule a technical interview for next week",
    "Request additional portfolio samples",
    "Share the job description details",
    "Confirm the application status",
  ],
  student: [
    "Ask about the interview process",
    "Request feedback on your application",
    "Confirm your availability",
    "Share your updated resume",
  ],
};
