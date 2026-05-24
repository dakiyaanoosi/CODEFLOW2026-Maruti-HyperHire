import { Timestamp } from "firebase/firestore";

export type EscrowStatus =
  | "funded"
  | "in_progress"
  | "revision_requested"
  | "completed"
  | "released";

export interface EscrowEvent {
  type: string;
  timestamp: string;
  note?: string;
}

export interface Escrow {
  escrowId: string;
  workflowId: string;
  applicationId: string;
  jobId: string;

  businessId: string;
  studentId: string;

  amount: number;
  platformFee?: number;
  payoutAmount?: number;

  status: EscrowStatus;

  fundedAt?: Timestamp | { toDate?: () => Date } | string | null;
  releasedAt?: Timestamp | { toDate?: () => Date } | string | null;
  createdAt: Timestamp | { toDate?: () => Date } | string;
  updatedAt: Timestamp | { toDate?: () => Date } | string;

  // UI convenience fields
  jobTitle?: string;
  businessName?: string;
  studentName?: string;
  submissionNote?: string;
  revisionNote?: string;
  timeline: EscrowEvent[];
}

export type EscrowTransaction = Escrow;

export interface EscrowSummary {
  totalFunded: number;
  totalReleased: number;
  pendingApproval: number;
  inReview: number;
  transactions: Escrow[];
}
