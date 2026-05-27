import { Timestamp } from "firebase/firestore";

export type ReviewStatus = "pending" | "submitted";

export interface Review {
  reviewId: string; // Deterministic ID format: `rev_${reviewerId}_${workflowId}`

  workflowId: string;
  escrowId: string;
  applicationId: string;

  businessId: string;
  studentId: string;

  reviewerId: string;
  revieweeId: string;
  reviewerRole: "student" | "business";

  rating: number; // Overall rating (1–5)

  communicationRating?: number; // 1–5
  qualityRating?: number; // 1–5
  timelinessRating?: number; // 1–5

  reviewText?: string;

  status: ReviewStatus;

  createdAt: Timestamp | { toDate?: () => Date } | string;
  updatedAt: Timestamp | { toDate?: () => Date } | string;
}
