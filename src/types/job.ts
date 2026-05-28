import { WorkCategory } from "./profile";

export type JobStatus = "Draft" | "Published" | "Completed";
export type WorkMode = "Remote" | "On-site" | "Hybrid";
export type JobDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Job {
  jobId: string;
  businessId: string;
  companyName: string;
  title: string;
  description: string;
  category: WorkCategory | string;
  requiredSkills: string[];
  budget: number;
  deadline: string; // ISO date string
  difficultyLevel: JobDifficulty;
  workMode: WorkMode;
  deliverables: string[];
  status: JobStatus;
  // Legacy optional fields kept for previously saved demo listings.
  aiGeneratedSummary?: string;
  aiExtractedSkills?: string[];
  aiDifficultyScore?: number;
  
  createdAt: string;
  updatedAt: string;
}
