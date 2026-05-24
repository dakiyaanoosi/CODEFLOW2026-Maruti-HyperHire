export interface Workflow {
  workflowId: string;
  jobId: string;
  applicationId: string;
  studentId: string;
  businessId: string;
  status: "Pending" | "In Progress" | "Revision" | "Completed" | "Paid" | "active" | "completed" | "archived";
  progress: number;
  createdAt: string;
  updatedAt: string;
  
  // Denormalized data for UI rendering without extra queries
  jobTitle: string;
  studentName: string;
  businessName: string;
  studentAvatar?: string;
  businessAvatar?: string;
}

export interface WorkflowColumn {
  columnId: string;
  workflowId: string;
  name: string;
  order: number;
  studentId: string;
  businessId: string;
  createdAt: string;
}

export interface WorkflowTaskAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface WorkflowTask {
  taskId: string;
  workflowId: string;
  columnId: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  assigneeId: string;
  dueDate?: string;
  attachments: WorkflowTaskAttachment[];
  aiSuggestions: string[];
  status: "active" | "blocked" | "completed";
  studentId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowActivityType = 
  | "task_created" 
  | "task_moved" 
  | "task_completed" 
  | "attachment_uploaded" 
  | "message_sent" 
  | "milestone_completed"
  | "workflow_created";

export interface WorkflowActivity {
  activityId: string;
  workflowId: string;
  taskId?: string;
  type: WorkflowActivityType;
  message: string;
  actorId: string;
  actorName: string;
  studentId: string;
  businessId: string;
  createdAt: string;
}
