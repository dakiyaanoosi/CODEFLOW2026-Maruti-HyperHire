export type InsightPriority = "urgent" | "high" | "medium" | "info";
export type InsightCategory = "risk" | "opportunity" | "trust_growth" | "workflow_efficiency" | "market_trend";

export interface ContextualInsight {
  id: string;
  category: InsightCategory;
  priority: InsightPriority;
  confidence: number; // 0-100 score indicating AI certainty
  title: string;
  description: string;
  signalsAnalyzed: string[]; // Explainability: e.g. ["workflow inactivity", "declining trust"]
  actionableAdvice: string;
  relatedEntityUrl?: string; // e.g. /workflows/123
  createdAt: string;
  expiresAt: string; // Lifecycle management
}

export interface AIEcosystemSummary {
  executiveSummary: string;
  overallHealth: "excellent" | "stable" | "at_risk" | "volatile";
  lastAnalyzedAt: string;
}

export interface AIContextState {
  insights: ContextualInsight[];
  ecosystemSummary: AIEcosystemSummary | null;
  dismissedInsightIds: Record<string, number>; // id -> timestamp for cooldowns
  isEvaluating: boolean;
}

export interface PlatformSignalPayload {
  userId: string;
  role: string;
  trustDimensions: Record<string, number>;
  activeWorkflowsCount: number;
  overdueTasksCount: number;
  recentActivityCount: number;
  marketSpecialization: string[]; // e.g. ["React", "UI/UX"]
}

export interface AIContextResponse {
  summary: AIEcosystemSummary;
  insights: ContextualInsight[];
}
