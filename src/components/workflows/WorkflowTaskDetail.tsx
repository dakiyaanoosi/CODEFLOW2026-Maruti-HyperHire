"use client";

import * as React from "react";
import { Workflow, WorkflowTask, WorkflowColumn } from "@/types/workflow";
import { workflowService } from "@/lib/workflow-service";
import { uploadFile } from "@/lib/cloudinary";
import { X, Calendar, Paperclip, Loader2, FileText, ImageIcon, File, Sparkles } from "lucide-react";
import { formatFileSize } from "@/lib/message-utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { canEditTask } from "@/lib/collaboration/permission-policy";

interface WorkflowTaskDetailProps {
  task: WorkflowTask | null;
  isOpen: boolean;
  onClose: () => void;
  actorId: string;
  actorRole: "student" | "business";
  actorName: string;
  workflow: Workflow;
  columns: WorkflowColumn[];
}

export function WorkflowTaskDetail({
  task,
  isOpen,
  onClose,
  actorId,
  actorRole,
  actorName,
  workflow,
  columns,
}: WorkflowTaskDetailProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen || !task) return null;

  const isEditable = canEditTask(actorId, actorRole, task);
  const currentColumn = columns.find(c => c.columnId === task.columnId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isEditable) {
      alert("Permission Denied: You are not authorized to upload deliverables to this task.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await uploadFile(file, setUploadProgress);
      
      let type = "file";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type === "application/pdf") type = "pdf";

      const newAttachment = {
        name: file.name || "Attachment",
        url: result.url,
        type,
        size: file.size,
      };

      await workflowService.updateTask(task.taskId, {
        attachments: [...(task.attachments || []), newAttachment]
      }, actorId, actorRole);

      await workflowService.logActivity({
        workflowId: workflow.workflowId,
        taskId: task.taskId,
        type: "attachment_uploaded",
        message: `uploaded ${file.name} to task "${task.title}"`,
        actorId: actorId,
        actorName,
        studentId: workflow.studentId,
        businessId: workflow.businessId
      });

    } catch (err: any) {
      console.error("Upload failed", err);
      alert(err.message || "Failed to upload attachment");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "active" | "blocked" | "completed";
    if (!isEditable) {
      alert("Permission Denied: You are not authorized to update this task status.");
      return;
    }

    try {
      await workflowService.updateTask(task.taskId, { status: val }, actorId, actorRole);
      if (val === "completed") {
        await workflowService.logActivity({
          workflowId: workflow.workflowId,
          taskId: task.taskId,
          type: "task_completed",
          message: `completed task "${task.title}"`,
          actorId: actorId,
          actorName,
          studentId: workflow.studentId,
          businessId: workflow.businessId
        });
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-brand-ink/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-[500px] h-full bg-white shadow-2xl border-l border-brand-hairline flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-hairline">
            <h2 className="text-lg font-semibold text-brand-ink truncate pr-4">Task Details</h2>
            <button onClick={onClose} className="p-1 rounded-md text-brand-muted hover:bg-brand-surface-soft hover:text-brand-ink">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            
            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  task.priority === "High" ? "bg-[#aa2d00]/10 text-[#aa2d00]" :
                  task.priority === "Medium" ? "bg-[#d9a441]/10 text-[#8a6200]" :
                  "bg-brand-surface-strong text-brand-muted"
                )}>
                  {task.priority} Priority
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-surface-soft text-brand-ink border border-brand-hairline">
                  {currentColumn?.name || "Unknown Stage"}
                </span>
              </div>
              <h1 className="text-[22px] font-semibold text-brand-ink leading-[1.3] mb-3">
                {task.title}
              </h1>
              <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>

            {/* AI Suggestions Block */}
            {task.aiSuggestions && task.aiSuggestions.length > 0 && (
              <div className="rounded-[10px] border border-brand-secondary/30 bg-brand-secondary/5 p-4">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-brand-secondary mb-3 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  HyperAI Suggestions
                </h4>
                <ul className="space-y-2">
                  {task.aiSuggestions.map((sug, i) => (
                    <li key={i} className="text-sm text-brand-ink flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5 shrink-0" />
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-muted uppercase">Status</label>
                <select 
                  className="w-full h-10 px-3 text-sm rounded-md border border-brand-hairline bg-white focus:outline-none focus:border-brand-primary disabled:opacity-60"
                  value={task.status}
                  onChange={handleStatusChange}
                  disabled={!isEditable}
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-muted uppercase">Due Date</label>
                <div className="flex items-center gap-2 h-10 px-3 text-sm rounded-md border border-brand-hairline bg-brand-surface-soft text-brand-ink">
                  <Calendar className="w-4 h-4 text-brand-muted" />
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand-ink">Attachments & Deliverables</h3>
                {isEditable && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs font-medium text-brand-link hover:text-brand-link/80 disabled:opacity-50"
                  >
                    + Upload File
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  accept="image/*,application/pdf"
                />
              </div>

              {isUploading && (
                <div className="flex items-center gap-3 p-3 rounded-md border border-brand-hairline bg-brand-surface-soft">
                  <Loader2 className="w-4 h-4 text-brand-muted animate-spin" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-brand-ink">Uploading...</p>
                    <div className="w-full h-1 bg-brand-hairline rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-brand-primary" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {(!task.attachments || task.attachments.length === 0) && !isUploading ? (
                <div className="p-4 rounded-[10px] border border-dashed border-brand-hairline text-center">
                  <p className="text-xs text-brand-muted">No attachments yet. Upload final deliverables or work-in-progress files here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {task.attachments?.map((att, idx) => {
                    const Icon = att.type === "pdf" ? FileText : att.type === "image" ? ImageIcon : File;
                    return (
                      <a 
                        key={idx} 
                        href={att.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-md border border-brand-hairline hover:bg-brand-surface-soft transition-colors group"
                      >
                        <div className="p-2 rounded bg-white border border-brand-hairline shadow-sm">
                          <Icon className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-ink truncate">{att.name}</p>
                          <p className="text-[10px] text-brand-muted">{att.size ? formatFileSize(att.size) : att.type.toUpperCase()}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
