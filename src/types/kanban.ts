export type KanbanStage =
  | "Pending"
  | "In Progress"
  | "Revision"
  | "Completed"
  | "Paid";

export const KANBAN_STAGES: KanbanStage[] = [
  "Pending",
  "In Progress",
  "Revision",
  "Completed",
  "Paid",
];

export interface KanbanActivity {
  id: string;
  type: "status_change" | "note" | "created" | "deadline_update";
  message: string;
  timestamp: string;
  actorName: string;
}

export interface KanbanTask {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  studentName: string;
  studentId: string;
  businessId: string;

  stage: KanbanStage;
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  proposedBudget: number;
  estimatedDeliveryDays: number;

  // Progress 0–100
  progress: number;

  tags: string[];
  activityLog: KanbanActivity[];

  createdAt: string;
  updatedAt: string;
}

export const STAGE_CONFIG: Record<
  KanbanStage,
  {
    label: string;
    color: string;         // text color
    bg: string;            // column bg
    headerBg: string;      // column header
    accentBar: string;     // top border color hex
    dotColor: string;
  }
> = {
  Pending: {
    label: "Pending",
    color: "text-[#41454d]",
    bg: "bg-[#f8fafc]",
    headerBg: "bg-white",
    accentBar: "#dddddd",
    dotColor: "#9297a0",
  },
  "In Progress": {
    label: "In Progress",
    color: "text-[#254fad]",
    bg: "bg-[#f5f8ff]",
    headerBg: "bg-white",
    accentBar: "#254fad",
    dotColor: "#254fad",
  },
  Revision: {
    label: "Revision",
    color: "text-[#8a6200]",
    bg: "bg-[#fffbf0]",
    headerBg: "bg-white",
    accentBar: "#d9a441",
    dotColor: "#d9a441",
  },
  Completed: {
    label: "Completed",
    color: "text-[#006400]",
    bg: "bg-[#f3faf3]",
    headerBg: "bg-white",
    accentBar: "#006400",
    dotColor: "#006400",
  },
  Paid: {
    label: "Paid",
    color: "text-[#181d26]",
    bg: "bg-[#f8fafc]",
    headerBg: "bg-[#181d26]",
    accentBar: "#181d26",
    dotColor: "#fcab79",
  },
};

export const PRIORITY_CONFIG = {
  Low: { bg: "bg-[#f8fafc]", text: "text-[#41454d]", border: "border-[#dddddd]" },
  Medium: { bg: "bg-[#d9a441]/10", text: "text-[#8a6200]", border: "border-[#d9a441]/30" },
  High: { bg: "bg-[#aa2d00]/10", text: "text-[#aa2d00]", border: "border-[#aa2d00]/25" },
};
