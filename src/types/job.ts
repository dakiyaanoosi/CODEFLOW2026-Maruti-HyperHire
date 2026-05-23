import { WorkCategory } from "./profile";

export type JobStatus = "Draft" | "Published";
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
  
  // AI-Assisted fields (optional/computed by simulated AI engine)
  aiGeneratedSummary?: string;
  aiExtractedSkills?: string[];
  aiDifficultyScore?: number; // 1-10 estimation
  
  createdAt: string;
  updatedAt: string;
}
