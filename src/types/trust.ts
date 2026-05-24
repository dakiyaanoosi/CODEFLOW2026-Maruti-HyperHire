export type TrustDimension = "reliability" | "communication" | "delivery" | "collaboration";
export type TrustTrend = "improving" | "declining" | "stable";
export type TrustRank = "Bronze" | "Silver" | "Gold" | "Platinum" | "Elite";
export type UserRole = "student" | "business";

export interface TrustDimensions {
  reliability: number;     // e.g. meeting deadlines, showing up
  communication: number;   // e.g. response time, clear updates
  delivery: number;        // e.g. quality of work, acceptance rate
  collaboration: number;   // e.g. teamwork, lack of disputes
}

export interface TrustProfile {
  userId: string;
  role: UserRole;
  overallScore: number;
  rank: TrustRank;
  dimensions: TrustDimensions;
  percentile: number;
  trend: TrustTrend;
  volatilityIndex: number; // High volatility means erratic behavior
  lastCalculatedAt: string;
}

export interface TrustEvent {
  eventId: string;
  userId: string;
  role: UserRole;
  dimension: TrustDimension;
  impactScore: number; // e.g. +2, -5
  reason: string;
  relatedEntityId?: string; // e.g. workflowId, taskId, applicationId
  relatedEntityType?: "workflow" | "task" | "application" | "message";
  createdAt: string;
}

export interface AITrustExplanation {
  explanation: string;
  risksDetected: string[];
  growthOpportunities: string[];
}
