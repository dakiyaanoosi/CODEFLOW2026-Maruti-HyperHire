import { Timestamp } from "firebase/firestore";

export type EscrowStatus =
  | "pending_funding"
  | "funded"
  | "eligible_for_release"
  | "released"
  | "disputed"
  | "cancelled";

export interface EscrowEvent {
  type: string;
  timestamp: string;
  note?: string;
}

export interface Escrow {
  escrowId: string;
  workflowId: string;
  collaborationId?: string;
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
  releaseEligibleAt?: Timestamp | { toDate?: () => Date } | string | null;
  
  disputeReason?: string;

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
