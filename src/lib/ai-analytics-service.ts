import { aiFetch } from "@/services/ai/client";

export interface SkillCluster {
  category_id: number;
  skills: string[];
}

export interface TrendingSkill {
  skill: string;
  demand_score: number;
  momentum: "↑" | "↓" | "→";
}

export interface MarketHeatmapResponse {
  insights: string[];
  trending_skills: TrendingSkill[];
  skill_clusters: SkillCluster[];
}

export const aiAnalyticsService = {
  /**
   * Generates an AI-driven market heatmap by analyzing portfolio skills
   * against active job requirements using semantic embeddings.
   */
  async generateMarketHeatmap(
    portfolioSkills: string[],
    jobRequirements: string[]
  ): Promise<MarketHeatmapResponse> {
    return aiFetch<MarketHeatmapResponse>(
      "/analytics/market-heatmap",
      {
        method: "POST",
        body: JSON.stringify({
          portfolio_skills: portfolioSkills,
          job_requirements: jobRequirements,
        }),
      },
      {
        insights: ["Unable to load semantic market insights at this time."],
        trending_skills: [],
        skill_clusters: []
      }
    );
  }
};
