import { WorkCategory } from "./profile";

export type PortfolioMediaType = "image" | "video" | "pdf" | "link";

export interface PortfolioItem {
  portfolioId: string;
  userId: string;
  title: string;
  description: string;
  category: WorkCategory | string;
  mediaType: PortfolioMediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  tags: string[]; // skill or custom tags
  aiSummary?: string; // AI generated portfolio summary
  createdAt: string;
  updatedAt: string;
}
