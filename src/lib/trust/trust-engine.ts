import { TrustEvent, TrustRank, TrustDimensions, TrustTrend } from "@/types/trust";

const BASELINE_SCORE = 80;
const HALF_LIFE_DAYS = 30; // Events lose 50% of their weight every 30 days
const DECAY_CONSTANT = Math.LN2 / HALF_LIFE_DAYS; 

export const trustEngine = {
  calculateRank(score: number): TrustRank {
    if (score >= 95) return "Elite";
    if (score >= 90) return "Platinum";
    if (score >= 80) return "Gold";
    if (score >= 70) return "Silver";
    return "Bronze";
  },

  calculateDecayedScore(events: TrustEvent[]): number {
    const now = Date.now();
    let netImpact = 0;

    for (const event of events) {
      const eventTime = new Date(event.createdAt).getTime();
      const daysOld = Math.max(0, (now - eventTime) / (1000 * 60 * 60 * 24));
      const weight = Math.exp(-DECAY_CONSTANT * daysOld);
      netImpact += event.impactScore * weight;
    }

    const finalScore = Math.min(100, Math.max(0, BASELINE_SCORE + netImpact));
    return Math.round(finalScore);
  },

  calculateDimensions(events: TrustEvent[]): TrustDimensions {
    const dims: TrustDimensions = {
      reliability: BASELINE_SCORE,
      communication: BASELINE_SCORE,
      delivery: BASELINE_SCORE,
      collaboration: BASELINE_SCORE,
    };

    const now = Date.now();

    for (const event of events) {
      const eventTime = new Date(event.createdAt).getTime();
      const daysOld = Math.max(0, (now - eventTime) / (1000 * 60 * 60 * 24));
      const weight = Math.exp(-DECAY_CONSTANT * daysOld);
      
      const impact = event.impactScore * weight;
      if (dims[event.dimension] !== undefined) {
        dims[event.dimension] += impact;
      }
    }

    return {
      reliability: Math.min(100, Math.max(0, Math.round(dims.reliability))),
      communication: Math.min(100, Math.max(0, Math.round(dims.communication))),
      delivery: Math.min(100, Math.max(0, Math.round(dims.delivery))),
      collaboration: Math.min(100, Math.max(0, Math.round(dims.collaboration))),
    };
  },

  calculateVolatility(events: TrustEvent[]): number {
    if (events.length < 2) return 0;
    
    // Volatility is defined as the variance/standard deviation of recent impacts
    const recentEvents = events.filter(e => {
      const daysOld = (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld <= 30; // Look at last 30 days
    });

    if (recentEvents.length < 2) return 0;

    const mean = recentEvents.reduce((acc, curr) => acc + curr.impactScore, 0) / recentEvents.length;
    const variance = recentEvents.reduce((acc, curr) => acc + Math.pow(curr.impactScore - mean, 2), 0) / recentEvents.length;
    
    // Scale 0-100 where 100 is highly volatile (e.g. swinging +10 to -10)
    const stdDev = Math.sqrt(variance);
    return Math.min(100, Math.round(stdDev * 10));
  },

  calculateTrend(events: TrustEvent[]): TrustTrend {
    const now = Date.now();
    let recentImpact = 0;
    let olderImpact = 0;

    for (const event of events) {
      const daysOld = (now - new Date(event.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld <= 14) {
        recentImpact += event.impactScore;
      } else if (daysOld <= 45) {
        olderImpact += event.impactScore;
      }
    }

    if (recentImpact > olderImpact + 2) return "improving";
    if (recentImpact < olderImpact - 2) return "declining";
    return "stable";
  }
};
