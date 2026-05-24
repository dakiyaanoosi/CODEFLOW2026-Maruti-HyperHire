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

/**
 * Dynamically generates contextual replies and suggestions based on conversation history and active messaging context.
 * Replaces static arrays to guarantee believable, collaboration-aware assistance.
 */
export function getContextualSuggestions(
  role: "student" | "business",
  conversation: Conversation,
  lastMessage?: Message
): { replies: AiQuickReply[]; suggestions: string[] } {
  const businessName = conversation.participantNames[conversation.participantIds.find(id => conversation.participantRoles[id] === "business") || ""] || "Client";
  const studentName = conversation.participantNames[conversation.participantIds.find(id => conversation.participantRoles[id] === "student") || ""] || "Student";
  const partnerName = role === "business" ? studentName : businessName;

  const lastContent = lastMessage?.content?.toLowerCase() || "";
  
  let replies: AiQuickReply[] = [];
  let suggestions: string[] = [];

  if (
    lastContent.includes("milestone") || 
    lastContent.includes("escrow") || 
    lastContent.includes("payment") || 
    lastContent.includes("release") ||
    lastContent.includes("fund")
  ) {
    if (role === "student") {
      replies = [
        { id: "qr-c1", label: "Confirm payment release", content: `Thanks! I see the escrow payment has been released. I will finalize and upload the build.` },
        { id: "qr-c2", label: "Ask about milestone approval", content: `Can you check if the current milestone is approved on your dashboard so the escrow can be released?` },
      ];
      suggestions = [
        "Inquire about escrow status",
        "Confirm milestone deliverable details",
        "Offer details on next milestone kickoff"
      ];
    } else {
      replies = [
        { id: "qr-c3", label: "Confirm escrow funding", content: `I have funded the escrow milestone. Please review the deliverables checklist.` },
        { id: "qr-c4", label: "Approve and release", content: `I have verified the files. Releasing the escrow funds now.` },
      ];
      suggestions = [
        "Ask student about current milestone progress",
        "Specify changes needed before release",
        "Confirm budget parameters"
      ];
    }
  } else if (
    lastContent.includes("timeline") || 
    lastContent.includes("schedule") || 
    lastContent.includes("when") || 
    lastContent.includes("date") || 
    lastContent.includes("due") ||
    lastContent.includes("deadline")
  ) {
    if (role === "student") {
      replies = [
        { id: "qr-t1", label: "Propose delivery date", content: `I'll complete the core deliverables by early next week. Does that fit your schedule?` },
        { id: "qr-t2", label: "Confirm final timeline", content: `Can you confirm final deliverable timeline and checklist?` },
      ];
      suggestions = [
        "Share availability for alignment sync",
        "Propose phased delivery timeline",
        "Request clarification on task deadlines"
      ];
    } else {
      replies = [
        { id: "qr-t3", label: "Ask for timeline update", content: `Could you share your estimated completion date for this phase?` },
        { id: "qr-t4", label: "Specify delivery target", content: `We need to target final delivery before the end of next week.` },
      ];
      suggestions = [
        "Ask candidate to confirm availability",
        "Propose timeline review call",
        "Flag timeline changes due to scope adjustment"
      ];
    }
  } else if (
    lastContent.includes("revision") || 
    lastContent.includes("fix") || 
    lastContent.includes("change") || 
    lastContent.includes("update") || 
    lastContent.includes("error") ||
    lastContent.includes("bug")
  ) {
    if (role === "student") {
      replies = [
        { id: "qr-r1", label: "Confirm revision needs", content: `I understand. I'll implement those changes and share the updated draft shortly.` },
        { id: "qr-r2", label: "Request revision details", content: `Could you specify the exact changes or share a screenshot of the issues?` },
      ];
      suggestions = [
        "Request revision clarification",
        "Confirm timeline for revisions",
        "Propose code review session"
      ];
    } else {
      replies = [
        { id: "qr-r3", label: "Describe changes", content: `Please review the latest comments. The current workflow may require revision clarification.` },
        { id: "qr-r4", label: "Request a correction", content: `We found a minor layout bug on mobile viewports. Could you correct that?` },
      ];
      suggestions = [
        "Explain revision requirements",
        "Share screenshot of issues",
        "Acknowledge student's quick turnaround"
      ];
    }
  } else {
    // Default contextual templates
    if (role === "student") {
      replies = [
        { id: "qr-d1", label: "Acknowledge message", content: `Thanks for the details, ${partnerName}. I will review them and update you shortly.` },
        { id: "qr-d2", label: "Confirm details", content: `Understood. I'll start working on this task and document progress on our workflow board.` },
      ];
      suggestions = [
        "Provide project progress update",
        "Clarify requirement checklist",
        "Schedule alignment sync call"
      ];
    } else {
      replies = [
        { id: "qr-d3", label: "Check progress", content: `Hi ${partnerName}, how is progress on the current set of tasks? let me know if you need any resources.` },
        { id: "qr-d4", label: "Approve deliverables", content: `This looks great, thank you! Let's proceed to the next phase of the project.` },
      ];
      suggestions = [
        "Share reference guidelines",
        "Request status check-in",
        "Schedule technical walkthrough"
      ];
    }
  }

  return { replies, suggestions };
}
