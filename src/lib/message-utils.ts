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
