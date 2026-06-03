"use client";

import * as React from "react";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  ArrowRight, 
  Loader2, 
  FileText,
  Clock,
  Coins,
  Flag
} from "lucide-react";
import { Message, AttachmentType } from "@/types/message";
import { Collaboration } from "@/types/collaboration";
import { WorkflowTask } from "@/types/workflow";
import { Deliverable } from "@/types/deliverable";
import { Milestone } from "@/types/milestone";
import { Escrow } from "@/types/escrow";
import { MessageBubble } from "./MessageBubble";
import { uploadFile } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface CollaborationCommunicationPanelProps {
  collaboration: Collaboration;
  messages: Message[];
  currentUserId: string;
  currentUserRole: "student" | "business";
  onSendMessage: (
    content: string, 
    attachmentUrl?: string, 
    attachmentType?: AttachmentType,
    contextType?: "general" | "task" | "milestone" | "deliverable" | "review" | "escrow",
    contextId?: string
  ) => Promise<void>;
  onNavigateToContext?: (contextType: string, contextId: string) => void;
  tasks: WorkflowTask[];
  deliverables: Deliverable[];
  milestones: Milestone[];
  escrow: Escrow | null;
}

export function CollaborationCommunicationPanel({
  collaboration,
  messages,
  currentUserId,
  currentUserRole,
  onSendMessage,
  onNavigateToContext,
  tasks,
  deliverables,
  milestones,
}: CollaborationCommunicationPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"chat" | "threads">("chat");
  const [draft, setDraft] = React.useState("");
  
  // Context thread selector states
  const [selectedContext, setSelectedContext] = React.useState<{
    type: "general" | "task" | "milestone" | "deliverable" | "review" | "escrow";
    id?: string;
    label: string;
  } | null>(null);

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const chatBottomRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages or active view changes
  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedContext, activeTab]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    
    const contextType = selectedContext?.type || "general";
    const contextId = selectedContext?.id || undefined;

    await onSendMessage(text, undefined, undefined, contextType, contextId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await uploadFile(file, (p) => setUploadProgress(p));
      
      let type: AttachmentType = "file";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type === "application/pdf") type = "pdf";

      const contextType = selectedContext?.type || "general";
      const contextId = selectedContext?.id || undefined;

      await onSendMessage(file.name || "Attachment", result.url, type, contextType, contextId);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload attachment");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Group messages for active view
  const displayMessages = React.useMemo(() => {
    if (activeTab === "chat" && !selectedContext) {
      // Global Timeline shows everything
      return messages;
    }
    
    // Context-specific filter
    const targetType = selectedContext?.type || "general";
    const targetId = selectedContext?.id;
    
    return messages.filter(
      (m) => m.contextType === targetType && m.contextId === targetId
    );
  }, [messages, activeTab, selectedContext]);

  // Extract unique threads that have conversations in messages
  const activeThreads = React.useMemo(() => {
    const threadsMap = new Map<string, {
      type: "general" | "task" | "milestone" | "deliverable" | "review" | "escrow";
      id?: string;
      label: string;
      latestTime: number;
      msgCount: number;
    }>();

    messages.forEach((msg) => {
      if (!msg.contextType || msg.contextType === "general" || !msg.contextId) return;

      const key = `${msg.contextType}_${msg.contextId}`;
      const msgTime = new Date(msg.createdAt).getTime();

      let label = `${msg.contextType.toUpperCase()}: ${msg.contextId}`;
      if (msg.contextType === "task") {
        const t = tasks.find(x => x.taskId === msg.contextId);
        label = t ? `Task: ${t.title}` : `Task discussion`;
      } else if (msg.contextType === "deliverable") {
        const d = deliverables.find(x => x.deliverableId === msg.contextId);
        label = d ? `Deliverable v${d.version}: ${d.title}` : `Deliverable discussion`;
      } else if (msg.contextType === "milestone") {
        const m = milestones.find(x => x.milestoneId === msg.contextId);
        label = m ? `Milestone: ${m.title}` : `Milestone planning`;
      } else if (msg.contextType === "escrow") {
        label = "Escrow Ledger Contract";
      }

      const existing = threadsMap.get(key);
      if (!existing || msgTime > existing.latestTime) {
        threadsMap.set(key, {
          type: msg.contextType,
          id: msg.contextId,
          label,
          latestTime: msgTime,
          msgCount: (existing?.msgCount || 0) + 1
        });
      } else {
        existing.msgCount += 1;
      }
    });

    return Array.from(threadsMap.values()).sort((a, b) => b.latestTime - a.latestTime);
  }, [messages, tasks, deliverables, milestones]);

  const senderName = (id: string) => {
    if (id === currentUserId) return "You";
    if (id === "system") return "System";
    return id === collaboration.businessId ? collaboration.businessName : collaboration.studentName;
  };

  return (
    <div className="flex h-full flex-col bg-white border border-brand-hairline rounded-xl shadow-sm overflow-hidden min-h-[480px]">
      
      {/* Tab Switcher Headers */}
      <div className="flex border-b border-brand-hairline bg-brand-surface-soft/25 shrink-0">
        <button
          onClick={() => {
            setActiveTab("chat");
            setSelectedContext(null);
          }}
          className={cn(
            "flex-1 py-3 text-center text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer",
            activeTab === "chat" && !selectedContext
              ? "border-brand-ink text-brand-ink bg-white"
              : "border-transparent text-brand-muted hover:text-brand-ink"
          )}
        >
          Workspace Timeline
        </button>
        <button
          onClick={() => setActiveTab("threads")}
          className={cn(
            "flex-1 py-3 text-center text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer",
            activeTab === "threads" || selectedContext
              ? "border-brand-ink text-brand-ink bg-white"
              : "border-transparent text-brand-muted hover:text-brand-ink"
          )}
        >
          Discussion Threads
          {activeThreads.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[9px] font-bold">
              {activeThreads.length}
            </span>
          )}
        </button>
      </div>

      {/* Main chat window vs thread browser */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-brand-surface-soft/10">
        
        {/* Render thread list */}
        {activeTab === "threads" && !selectedContext && (
          <div className="p-4 space-y-3">
            <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-2">
              Context-Linked Discussion Channels
            </h4>
            
            {activeThreads.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-brand-hairline rounded-xl bg-white">
                <MessageSquare className="h-8 w-8 text-brand-muted mx-auto opacity-20 mb-2" />
                <p className="text-xs text-brand-muted font-medium">No contextual discussions started yet.</p>
                <p className="text-[10px] text-brand-muted mt-1">Open a task detail drawer or comments section to start one.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeThreads.map((thread) => {
                  const Icon = 
                    thread.type === "task" ? Clock : 
                    thread.type === "deliverable" ? FileText : 
                    thread.type === "milestone" ? Flag : Coins;
                  
                  return (
                    <button
                      key={`${thread.type}_${thread.id}`}
                      onClick={() => setSelectedContext(thread)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-brand-hairline bg-white hover:border-brand-primary/40 hover:bg-brand-surface-soft/15 transition-all text-left shadow-sm group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full shrink-0",
                          thread.type === "task" ? "bg-brand-secondary/10 text-brand-secondary" :
                          thread.type === "deliverable" ? "bg-brand-primary/10 text-brand-primary" :
                          thread.type === "milestone" ? "bg-brand-success/10 text-brand-success" : "bg-[#f59e0b]/10 text-[#f59e0b]"
                        )}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-semibold text-brand-ink truncate pr-2 group-hover:text-brand-primary transition-colors">
                            {thread.label}
                          </h5>
                          <span className="text-[9px] text-brand-muted font-medium capitalize block mt-0.5">
                            {thread.msgCount} message{thread.msgCount > 1 ? "s" : ""} in thread
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-muted group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Render active chat view (either global or selected thread) */}
        {(activeTab === "chat" || selectedContext) && (
          <div className="flex flex-col h-full bg-white">
            
            {/* Header for selected thread context */}
            {selectedContext && (
              <div className="flex items-center justify-between border-b border-brand-hairline px-4 py-2 bg-brand-surface-soft/40">
                <button
                  onClick={() => setSelectedContext(null)}
                  className="text-xs font-semibold text-brand-link hover:underline flex items-center gap-1 cursor-pointer"
                >
                  &larr; Back to threads
                </button>
                <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-[0.2px] border border-brand-primary/15">
                  {selectedContext.type} thread
                </span>
              </div>
            )}

            {/* Message bubble stream */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-brand-surface-soft/20 min-h-[220px]">
              {displayMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-8 w-8 text-brand-muted opacity-20 mb-2" />
                  <p className="text-xs font-semibold text-brand-muted">No messages found here.</p>
                  <p className="text-[10px] text-brand-muted/80 max-w-[200px] mt-1 mx-auto leading-relaxed">
                    {selectedContext 
                      ? "Use the composer below to add context feedback." 
                      : "Start typing below to communicate with your counterparty."}
                  </p>
                </div>
              ) : (
                displayMessages.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  return (
                    <MessageBubble
                      key={msg.messageId}
                      message={msg}
                      isOwn={isOwn}
                      senderName={senderName(msg.senderId)}
                      onNavigateToContext={onNavigateToContext}
                    />
                  );
                })
              )}
              
              {isUploading && (
                <div className="flex items-center gap-2 text-[10px] font-medium text-brand-muted self-end pr-2 justify-end">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading artifact: {uploadProgress}%
                </div>
              )}
              
              <div ref={chatBottomRef} />
            </div>

            {/* Role-Aware Messaging Actions */}
            <div className="px-4 pt-2 pb-1.5 border-t border-brand-hairline/80 bg-brand-surface-soft/10 flex gap-2 flex-wrap items-center">
              <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">
                {currentUserRole === "business" ? "Client Review Shortcuts" : "Freelancer Actions"}
              </span>
              
              {currentUserRole === "business" ? (
                <>
                  <button 
                    onClick={() => setDraft("Could you please update this item and upload a new draft?")}
                    className="text-[9px] bg-white border border-brand-hairline hover:bg-brand-surface-soft px-2 py-0.5 rounded text-brand-muted hover:text-brand-ink transition-colors font-semibold cursor-pointer shadow-sm"
                  >
                    Request edit revision
                  </button>
                  <button 
                    onClick={() => setDraft("I have reviewed this submission. Looks great, thank you!")}
                    className="text-[9px] bg-white border border-brand-hairline hover:bg-brand-surface-soft px-2 py-0.5 rounded text-brand-muted hover:text-brand-ink transition-colors font-semibold cursor-pointer shadow-sm"
                  >
                    Confirm approval
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setDraft("I have updated the execution and uploaded the files. Let me know if this works!")}
                    className="text-[9px] bg-white border border-brand-hairline hover:bg-brand-surface-soft px-2 py-0.5 rounded text-brand-muted hover:text-brand-ink transition-colors font-semibold cursor-pointer shadow-sm"
                  >
                    Deliverable uploaded
                  </button>
                  <button 
                    onClick={() => setDraft("Could you clarify the requirement instructions for this step?")}
                    className="text-[9px] bg-white border border-brand-hairline hover:bg-brand-surface-soft px-2 py-0.5 rounded text-brand-muted hover:text-brand-ink transition-colors font-semibold cursor-pointer shadow-sm"
                  >
                    Clarify requirement
                  </button>
                </>
              )}
            </div>

            {/* Input Composer Box */}
            <div className="p-3 border-t border-brand-hairline flex items-center gap-2 bg-white shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 border border-brand-hairline rounded-lg text-brand-muted hover:bg-brand-surface-soft hover:text-brand-ink transition-all cursor-pointer shrink-0 shadow-sm"
                title="Attach project artifact"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
              />
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  selectedContext
                    ? `Message inside ${selectedContext.type} thread...`
                    : "Type general message in workspace..."
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                className="flex-1 min-w-0 rounded-lg border border-brand-hairline px-3 py-2 text-xs bg-white text-brand-ink focus:outline-none focus:border-brand-primary"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className="p-2 bg-brand-ink hover:bg-brand-primary-active disabled:opacity-50 text-white rounded-lg cursor-pointer transition-all flex items-center justify-center shrink-0 shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
