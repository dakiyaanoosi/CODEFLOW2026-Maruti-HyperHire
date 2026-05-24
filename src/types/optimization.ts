export interface OptimizationScores {
  overall: number;
  clarity: number;
  relevance: number;
  professionalism: number;
  marketCompetitiveness: number;
  trustCompatibility: number;
}

export interface OptimizationWeakness {
  phrase: string;
  reason: string;
  suggestedFix: string;
}

export interface OptimizationInsight {
  text: string;
  type: "strategic" | "market_trend" | "trust_impact";
}

export interface OptimizationAnalysis {
  scores: OptimizationScores;
  previousOverallScore: number | null;
  percentile: number; // e.g., Top 18% -> 18
  confidence: number;
  confidenceReasoning: string;
  weaknesses: OptimizationWeakness[];
  insights: OptimizationInsight[];
  lastUpdated: string;
}

export interface ProposalOptimizationPayload {
  text: string;
  jobDescription: string;
  jobRequiredSkills: string[];
  studentTrustScore: number;
}

export interface GigOptimizationPayload {
  title: string;
  description: string;
  budget: number;
  category: string;
  skills: string[];
  businessTrustScore: number;
}
