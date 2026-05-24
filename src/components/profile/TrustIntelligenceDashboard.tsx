"use client";

import * as React from "react";
import { TrustProfile, AITrustExplanation, TrustRank } from "@/types/trust";
import { trustService } from "@/lib/trust/trust-service";
import { aiTrustService } from "@/lib/trust/ai-trust-service";
import { useAuthStore } from "@/store/use-auth-store";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  PolarRadiusAxis
} from "recharts";
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BrainCircuit,
  AlertTriangle,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function TrustIntelligenceDashboard({ userId }: { userId?: string }) {
  const { user } = useAuthStore();
  const targetId = userId || user?.uid;
  
  const [profile, setProfile] = React.useState<TrustProfile | null>(null);
  const [explanation, setExplanation] = React.useState<AITrustExplanation | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!targetId) return;
    
    const unsubscribe = trustService.subscribeToTrustProfile(targetId, async (p) => {
      setProfile(p);
      if (p) {
        try {
          const aiExp = await aiTrustService.getTrustExplanation(p);
          setExplanation(aiExp);
        } catch (e) {
          console.error("AI Trust Service offline");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetId]);

  if (loading) {
    return <div className="h-64 rounded-xl border border-brand-hairline bg-brand-surface-soft animate-pulse" />;
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-brand-hairline bg-white p-8 text-center">
        <ShieldCheck className="h-10 w-10 text-brand-muted mx-auto mb-3 opacity-50" />
        <h3 className="text-sm font-semibold text-brand-ink">No Trust Data Available</h3>
        <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto">
          Complete workflows and communicate actively on the platform to generate a multi-dimensional trust profile.
        </p>
      </div>
    );
  }

  const radarData = [
    { subject: 'Reliability', A: profile.dimensions.reliability, fullMark: 100 },
    { subject: 'Communication', A: profile.dimensions.communication, fullMark: 100 },
    { subject: 'Delivery', A: profile.dimensions.delivery, fullMark: 100 },
    { subject: 'Collaboration', A: profile.dimensions.collaboration, fullMark: 100 },
  ];

  return (
    <div className="rounded-xl border border-brand-hairline bg-white overflow-hidden">
      <div className="p-6 border-b border-brand-hairline flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Core Identity */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className={cn("h-5 w-5", getRankColor(profile.rank))} />
              <h2 className="text-lg font-semibold text-brand-ink">Trust Intelligence</h2>
            </div>
            <p className="text-xs text-brand-muted">
              Marketplace credibility calculated via AI behavioral analysis.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div>
              <div className="text-[32px] font-normal leading-none tracking-tight text-brand-ink mb-1">
                {profile.overallScore}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted flex items-center gap-1.5">
                {profile.rank} Rank
              </div>
            </div>

            <div className="h-10 w-px bg-brand-hairline" />

            <div>
              <div className="text-[32px] font-normal leading-none tracking-tight text-brand-ink mb-1">
                Top {100 - profile.percentile}%
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted flex items-center gap-1.5">
                Marketplace Percentile
                {profile.trend === "improving" && <TrendingUp className="h-3 w-3 text-brand-success" />}
                {profile.trend === "declining" && <TrendingDown className="h-3 w-3 text-brand-coral" />}
                {profile.trend === "stable" && <Minus className="h-3 w-3 text-brand-muted" />}
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="w-full md:w-64 h-48 shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Trust"
                dataKey="A"
                stroke="#111827"
                fill="#111827"
                fillOpacity={0.1}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Behavioral Readout */}
      {explanation && (
        <div className="bg-brand-surface-soft p-6">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit className="h-4 w-4 text-brand-ink" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-ink">
              HyperAI Behavioral Readout
            </h3>
          </div>
          
          <p className="text-sm text-brand-ink leading-relaxed mb-5">
            {explanation.explanation}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {explanation.growthOpportunities.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-brand-success/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="h-3.5 w-3.5 text-brand-success" />
                  <span className="text-[11px] font-semibold text-brand-success uppercase tracking-wider">Growth Potential</span>
                </div>
                <ul className="space-y-1.5">
                  {explanation.growthOpportunities.map((g, i) => (
                    <li key={i} className="text-xs text-brand-body leading-relaxed">{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.risksDetected.length > 0 && explanation.risksDetected[0] !== "No critical behavioral risks detected." && (
              <div className="bg-white rounded-lg p-4 border border-brand-warning/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-brand-warning" />
                  <span className="text-[11px] font-semibold text-brand-warning uppercase tracking-wider">Risk Factors</span>
                </div>
                <ul className="space-y-1.5">
                  {explanation.risksDetected.map((r, i) => (
                    <li key={i} className="text-xs text-brand-body leading-relaxed">{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getRankColor(rank: TrustRank) {
  switch (rank) {
    case "Elite": return "text-brand-primary";
    case "Platinum": return "text-brand-ink";
    case "Gold": return "text-yellow-600";
    case "Silver": return "text-slate-500";
    case "Bronze": return "text-orange-700";
    default: return "text-brand-muted";
  }
}
