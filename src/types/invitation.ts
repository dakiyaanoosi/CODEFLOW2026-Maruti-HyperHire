export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

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
  respondedAt?: number;
}
