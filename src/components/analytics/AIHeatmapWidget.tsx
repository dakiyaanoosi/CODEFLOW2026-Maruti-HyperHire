"use client";

import * as React from "react";
import { aiAnalyticsService, MarketHeatmapResponse } from "@/lib/ai-analytics-service";
import { useAuthStore } from "@/store/use-auth-store";
import { Loader2, BrainCircuit, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AIHeatmapWidget() {
  const { profile } = useAuthStore();
  const [data, setData] = React.useState<MarketHeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadHeatmap() {
      // In a real scenario, we'd fetch actual portfolio skills and job requirements from DB here
      // For the demo, we use profile skills and simulated job requirements
      const pSkills = profile?.skills || ["React", "UI/UX", "TypeScript"];
      const jSkills = ["React Native", "AI Automation", "Figma", "Node.js", "Python"];

      const result = await aiAnalyticsService.generateMarketHeatmap(pSkills, jSkills);
      setData(result);
      setIsLoading(false);
    }
    loadHeatmap();
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center rounded-[12px] border border-brand-hairline bg-white p-6">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted mb-3" />
        <p className="text-xs text-brand-muted">Running semantic market analysis...</p>
      </div>
    );
  }

  if (!data || data.trending_skills.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[12px] border border-brand-hairline bg-white p-5 flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
            AI Market Heatmap
            <span className="px-1.5 py-0.5 rounded bg-brand-secondary/10 text-brand-secondary text-[10px] uppercase font-bold">Live</span>
          </h3>
          <p className="text-xs text-brand-muted mt-1">Semantic demand vs your skills</p>
        </div>
        <BrainCircuit className="w-5 h-5 text-brand-muted" />
      </div>

      {/* AI Insight Box */}
      {data.insights[0] && (
        <div className="mb-4 rounded-[8px] bg-brand-surface-soft border border-brand-hairline p-3">
          <p className="text-xs font-medium text-brand-ink leading-relaxed">
            {data.insights[0]}
          </p>
        </div>
      )}

      {/* Skills Grid */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {data.trending_skills.map((ts, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-[8px] hover:bg-brand-surface-soft transition-colors">
            <span className="text-sm font-medium text-brand-ink">{ts.skill}</span>
            <div className="flex items-center gap-3">
              <div className="w-24 h-1.5 bg-brand-surface-strong rounded-full overflow-hidden flex">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    ts.momentum === "↑" ? "bg-brand-success" : ts.momentum === "↓" ? "bg-brand-warning" : "bg-brand-muted"
                  )} 
                  style={{ width: `${ts.demand_score}%` }} 
                />
              </div>
              <span className="w-4 flex justify-end">
                {ts.momentum === "↑" && <TrendingUp className="w-3.5 h-3.5 text-brand-success" />}
                {ts.momentum === "↓" && <TrendingDown className="w-3.5 h-3.5 text-brand-warning" />}
                {ts.momentum === "→" && <Minus className="w-3.5 h-3.5 text-brand-muted" />}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
