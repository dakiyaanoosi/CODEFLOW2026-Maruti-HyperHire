import { TrustProfile, AITrustExplanation } from "@/types/trust";
import { aiFetch } from "@/services/ai/client";

function localTrustExplanation(profile: TrustProfile): AITrustExplanation {
  let explanation = "";
  const risks: string[] = [];
  const growth: string[] = [];

  const dims = profile.dimensions;

  if (profile.trend === "improving") {
    explanation += "Your marketplace credibility is growing. Repeated on-time workflow completion has increased reliability confidence. ";
  } else if (profile.trend === "declining") {
    explanation += "Recent activity has impacted your marketplace confidence. Decreased response times have created workflow friction. ";
  } else {
    explanation += "Your reputation remains stable. Consistent communication reviews have sustained your marketplace ranking. ";
  }

  explanation += `Currently in the Top ${Math.max(1, Math.round(100 - profile.percentile))}% for overall reliability.`;

  // Find lowest and highest dimensions
  const dimEntries = [
    { name: "reliability", val: dims.reliability },
    { name: "communication", val: dims.communication },
    { name: "delivery", val: dims.delivery },
    { name: "collaboration", val: dims.collaboration },
  ];
  
  const lowest_dim = dimEntries.reduce((prev, curr) => curr.val < prev.val ? curr : prev, dimEntries[0]);
  const highest_dim = dimEntries.reduce((prev, curr) => curr.val > prev.val ? curr : prev, dimEntries[0]);

  if (highest_dim.val > 85) {
    explanation += ` Strong performance in ${highest_dim.name} boosts your profile's recommendations.`;
  }
  if (lowest_dim.val < 75) {
    explanation += ` Improving consistent ${lowest_dim.name} will unlock further ranking potential.`;
  }

  // Risks
  if (profile.volatilityIndex > 20) {
    risks.push("Erratic task completion patterns detected. This lowers business hiring confidence.");
  }
  if (dims.communication < 75) {
    risks.push("Delayed responses are creating workflow friction.");
  }
  if (dims.delivery < 75) {
    risks.push("Missed deadlines observed in recent workflows. Abandonment risk flagged.");
  }

  // Growth
  if (lowest_dim.name === "communication") {
    growth.push("Maintain a <2 hour response time on new messages to quickly recover your score.");
  } else if (lowest_dim.name === "delivery") {
    growth.push("Deliver your next 3 milestones on or before the due date to unlock Gold status.");
  } else {
    growth.push("Ensure tasks are marked 'Completed' reliably without prolonged inactivity.");
  }

  if (growth.length === 0) {
    growth.push("Maintain your current consistency to reach the Elite tier.");
  }
  if (risks.length === 0) {
    risks.push("No critical behavioral risks detected.");
  }

  return {
    explanation: "[Fallback Mode] " + explanation.trim(),
    risksDetected: risks,
    growthOpportunities: growth,
  };
}

export const aiTrustService = {
  /**
   * Generates behavioral explanations and risk detection for a given TrustProfile.
   * If the AI engine is offline during dev, it degrades gracefully using fallback values.
   */
  async getTrustExplanation(profile: TrustProfile): Promise<AITrustExplanation> {
    try {
      return await aiFetch<AITrustExplanation>(
        "/trust/explain",
        {
          method: "POST",
          body: JSON.stringify(profile)
        }
      );
    } catch (err) {
      console.warn("AI Trust explanation API offline, returning deterministic fallback:", err);
      return localTrustExplanation(profile);
    }
  }
};
