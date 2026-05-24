import { StudentProfile } from "./profile";

// Minimized payload sent to FastAPI to prevent network bloat
export interface MinimalCandidatePayload {
  userId: string;
  skills: string[];
  bioSnippet: string;
  trustScore: number;
  experienceLevel: string;
  preferredCategories: string[];
}

export interface AIRecruiterGuidance {
  message: string;
  type: "warning" | "opportunity" | "market_trend";
}

export interface CandidateMatch {
  userId: string; // The ID of the matched candidate
  semanticScore: number;
  diversityBonus: number;
  freshnessWeight: number;
  overallScore: number;
  matchReasoning: string;
  riskFactors: string[];
  rarityIndicators: string[];
  momentum: "rising" | "stable" | "declining";
}

export interface TalentSearchResponse {
  matches: CandidateMatch[];
  recruiterGuidance: AIRecruiterGuidance[];
  searchIntentExtracted: string[];
}

// Client-side enriched type uniting the Firestore profile and the AI Match
export interface EnrichedCandidate {
  profile: StudentProfile & { uid: string };
  match: CandidateMatch;
}
