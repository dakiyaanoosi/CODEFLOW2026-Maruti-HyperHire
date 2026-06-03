import { Timestamp } from "firebase/firestore";

export type MilestoneStatus =
  | "pending"
  | "active"
  | "in_review"
  | "approved"
  | "revision_requested";

export interface Milestone {
  milestoneId: string;
  collaborationId: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  progress: number; // 0 to 100
  order: number;
  dueDate?: Timestamp | string | null;
  createdBy: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  approvedAt?: Timestamp | string | null;
  eligibleForRelease?: boolean;
  submissionNote?: string;
  revisionNote?: string;
}
