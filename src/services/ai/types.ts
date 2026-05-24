import { Job } from "@/types/job";
import { StudentProfile } from "@/types/profile";
import { PortfolioItem } from "@/types/portfolio";

export interface MatchWeights {
  semantic?: number;
  skills?: number;
  trust?: number;
  experience?: number;
  portfolio?: number;
  category?: number;
}

export interface ScoreBreakdown {
  semantic_similarity: number;
  skill_overlap: number;
  trust_score: number;
  experience_level: number;
  portfolio_relevance: number;
  category_alignment: number;
}

export interface CandidateWithPortfolios {
  id: string; // user UID
  profile: StudentProfile;
  portfolios: PortfolioItem[];
}

export interface ScoreRequest {
  job: Job;
  candidate: CandidateWithPortfolios;
  weights?: MatchWeights;
}

export interface ScoreResponse {
  candidate_id: string;
  match_percentage: number;
  ranking_score: number;
  confidence_score: number;
  breakdown: ScoreBreakdown;
  reasoning: string;
}

export interface MatchRequest {
  job: Job;
  candidates: CandidateWithPortfolios[];
  weights?: MatchWeights;
}

export interface MatchResponse {
  job_id: string;
  ranked_candidates: ScoreResponse[];
}

export interface RecommendRequest {
  candidate: CandidateWithPortfolios;
  jobs: Job[];
  weights?: MatchWeights;
}

export interface JobScoreResponse {
  job_id: string;
  title: string;
  company_name: string;
  match_percentage: number;
  ranking_score: number;
  confidence_score: number;
  breakdown: ScoreBreakdown;
  reasoning: string;
}

export interface RecommendResponse {
  candidate_id: string;
  ranked_jobs: JobScoreResponse[];
}

export interface EmbedRequest {
  texts: string[];
}

export interface EmbedResponse {
  embeddings: number[][];
}

// ─── HyperAI Chat Types ────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  pageContext: string | null;
  userRole: "student" | "business" | null;
  activeJob: any | null;
  activeProfile: any | null;
  activePortfolio: any[] | null;
  activeApplication: any | null;
  recommendationState: any | null;
}

export interface ChatResponse {
  response: string;
  suggestions: string[];
  quickActions: string[];
  reasoningHighlights: Record<string, any> | null;
}
