export type InvitationStatus = "pending" | "viewed" | "accepted" | "declined" | "expired" | "workflow_created";

export interface InvitationAnalytics {
  responseLatencyMs?: number;
  aiMatchScoreAtInvite?: number;
  wasPersonalized: boolean;
}

export interface GigInvitation {
  invitationId: string;
  businessId: string;
  businessName: string;
  studentId: string;
  jobId: string;
  jobTitle: string;
  status: InvitationStatus;
  message?: string;
  analyticsMetrics: InvitationAnalytics;
  createdAt: number;
  
  // Ecosystem Linkages
  conversationId?: string;
  workflowId?: string;
  applicationId?: string;
  
  // Lifecycle Metadata
  expiresAt: number;
  viewedAt?: number;
  acceptedAt?: number;
  declinedAt?: number;
  collaborationStartedAt?: number;
  acceptanceNote?: string;
}
