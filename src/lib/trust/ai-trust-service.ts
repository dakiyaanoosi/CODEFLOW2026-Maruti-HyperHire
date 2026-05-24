import { TrustProfile, AITrustExplanation } from "@/types/trust";
import { aiFetch } from "@/services/ai/client";

export const aiTrustService = {
  /**
   * Generates behavioral explanations and risk detection for a given TrustProfile.
   * If the AI engine is offline during dev, it degrades gracefully using fallback values.
   */
  async getTrustExplanation(profile: TrustProfile): Promise<AITrustExplanation> {
    return aiFetch<AITrustExplanation>(
      "/trust/explain",
      {
        method: "POST",
        body: JSON.stringify(profile)
      },
      {
        explanation: "Consistent delivery and communication are maintaining your marketplace rank. Continue this behavior to rise into higher percentiles.",
        risksDetected: ["No severe behavioral risks detected."],
        growthOpportunities: ["Maintain current activity levels to unlock the next rank."]
      }
    );
  }
};
