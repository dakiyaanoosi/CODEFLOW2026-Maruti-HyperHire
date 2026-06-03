import { Timestamp } from "firebase/firestore";

export interface DeliverableReview {
  reviewId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: "student" | "business";
  status: "approved" | "revision_requested";
  feedback?: string;
  createdAt: string;
}

export interface DeliverableComment {
  commentId: string;
  authorId: string;
  authorName: string;
  authorRole: "student" | "business";
  text: string;
  createdAt: string;
}

export interface Deliverable {
  deliverableId: string;
  collaborationId: string;
  taskId?: string;
  milestoneId?: string;

  submittedBy: string;

  title: string;
  description?: string;

  files: string[];

  version: number;

  reviewStatus: "pending_review" | "revision_requested" | "approved";

  feedback?: string;

  reviewedBy?: string;
  reviewedAt?: Timestamp | string | null;

  submittedAt: Timestamp | string;
  updatedAt: Timestamp | string;

  reviews?: DeliverableReview[];
  comments?: DeliverableComment[];
}

