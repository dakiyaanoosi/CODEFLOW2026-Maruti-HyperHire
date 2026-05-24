"use client";

import * as React from "react";
import { aiAnalyticsService, MarketHeatmapResponse, TrendingSkill } from "@/lib/ai-analytics-service";
import { useAuthStore } from "@/store/use-auth-store";
import { Loader2, BrainCircuit, TrendingUp, TrendingDown, Minus, Briefcase, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { jobService } from "@/lib/job-service";
import { portfolioService } from "@/lib/portfolio-service";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export function AIHeatmapWidget() {
  const { user, profile } = useAuthStore();
  const [data, setData] = React.useState<MarketHeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasNoData, setHasNoData] = React.useState(false);

  React.useEffect(() => {
    async function loadHeatmapData() {
      if (!user) return;
      setIsLoading(true);
      try {
        // 1. Gather student skills (profile skills + portfolio tags)
        const pSkills = profile?.skills || [];
        let portSkills: string[] = [];
        try {
          const portfolios = await portfolioService.getPortfolios(user.uid);
          portfolios.forEach(p => {
            if (p.tags) {
              portSkills = [...portSkills, ...p.tags];
            }
          });
        } catch (e) {
          console.error("Failed to load portfolio skills for heatmap:", e);
        }
        const studentSkills = Array.from(new Set([...pSkills, ...portSkills]));

        // 2. Fetch active jobs and extract required skills
        const activeJobs = await jobService.getJobs(undefined, true);
        
        // 3. Fetch workflows to analyze workflow demand
        let workflows: any[] = [];
        if (isFirebaseConfigured && db) {
          try {
            const wfSnap = await getDocs(collection(db, "workflows"));
            workflows = wfSnap.docs.map(doc => doc.data());
          } catch (e) {
            console.error("Failed to fetch workflows for heatmap:", e);
          }
        }

        if (activeJobs.length === 0) {
          setHasNoData(true);
          setIsLoading(false);
          return;
        }

        // 4. Compute Frequency, Demand Intensity, and Trend Scoring deterministically
        const skillFrequency: Record<string, number> = {};
        const skillWorkflows: Record<string, number> = {};
        const skillDates: Record<string, string[]> = {};

        activeJobs.forEach(job => {
          if (job.requiredSkills) {
            job.requiredSkills.forEach(skill => {
              const normalizedSkill = skill.trim();
              skillFrequency[normalizedSkill] = (skillFrequency[normalizedSkill] || 0) + 1;
              
              if (job.createdAt) {
                if (!skillDates[normalizedSkill]) skillDates[normalizedSkill] = [];
                skillDates[normalizedSkill].push(job.createdAt);
              }

              // Count active workflows using this job
              const activeWfsForJob = workflows.filter(w => w.jobId === job.jobId && w.status === "active").length;
              if (activeWfsForJob > 0) {
                skillWorkflows[normalizedSkill] = (skillWorkflows[normalizedSkill] || 0) + activeWfsForJob;
              }
            });
          }
        });

        const allJobSkills = Object.keys(skillFrequency);
        if (allJobSkills.length === 0) {
          setHasNoData(true);
          setIsLoading(false);
          return;
        }

        // Calculate Demand Intensity & Trend Scoring
        const calculatedTrendingSkills: TrendingSkill[] = allJobSkills.map(skill => {
          const freq = skillFrequency[skill];
          const wfDemand = skillWorkflows[skill] || 0;
          
          // Demand Intensity: Frequency + (Workflow Demand * 2)
          const demandIntensity = freq + (wfDemand * 2);
          
          // Trend Scoring / Momentum: Compare dates
          // If skill has jobs created in last 14 days
          const dates = skillDates[skill] || [];
          const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
          const recentCount = dates.filter(d => new Date(d).getTime() >= fourteenDaysAgo).length;
          
          let momentum: "↑" | "↓" | "→" = "→";
          if (recentCount > 0 && recentCount >= dates.length * 0.4) {
            momentum = "↑";
          } else if (recentCount === 0 && dates.length > 0) {
            momentum = "↓";
          }

          return {
            skill,
            demand_score: demandIntensity,
            momentum
          };
        });

        // Normalize demand score to 0-100 scale
        const maxRawScore = Math.max(...calculatedTrendingSkills.map(s => s.demand_score), 1);
        const normalizedTrendingSkills = calculatedTrendingSkills.map(s => ({
          ...s,
          demand_score: Math.min(100, Math.max(15, Math.round((s.demand_score / maxRawScore) * 100)))
        })).sort((a, b) => b.demand_score - a.demand_score);

        // 5. Call semantic matching route
        const pSkillsList = studentSkills.length > 0 ? studentSkills : ["React", "TypeScript", "Node.js"];
        const jSkillsList = allJobSkills.slice(0, 15); // Top 15 active job skills

        const semanticResult = await aiAnalyticsService.generateMarketHeatmap(pSkillsList, jSkillsList);

        // Combine semantic insights with our live calculated scores for matching skills
        const finalTrendingSkills = normalizedTrendingSkills.map(cts => {
          // Check if student has this skill
          const isStudentSkill = studentSkills.some(sk => sk.toLowerCase() === cts.skill.toLowerCase());
          return {
            ...cts,
            // If student has it, keep matching styles
            isMatch: isStudentSkill
          };
        }).slice(0, 5); // Display top 5

        // Generate dynamic insight if AI fails
        const topMarketSkill = finalTrendingSkills[0]?.skill || "General Development";
        let aiInsight = semanticResult.insights[0] || `Semantic analysis identifies ${topMarketSkill} as the highest volume market driver.`;
        if (studentSkills.includes(topMarketSkill)) {
          aiInsight = `Your skill in ${topMarketSkill} matches the current peak market demand intensity.`;
        } else if (finalTrendingSkills.length > 0) {
          aiInsight = `Market demands are centering on ${topMarketSkill}. Consider adding it to your portfolio tags.`;
        }

        setData({
          insights: [aiInsight],
          trending_skills: finalTrendingSkills,
          skill_clusters: semanticResult.skill_clusters
        });
        setHasNoData(false);
      } catch (err) {
        console.error("AI Heatmap calculation failed:", err);
        setHasNoData(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadHeatmapData();
  }, [user, profile]);

  if (isLoading) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center rounded-[12px] border border-brand-hairline bg-white p-6 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary mb-3" />
        <p className="text-xs text-brand-muted">Aggregating live gig requirements...</p>
      </div>
    );
  }

  if (hasNoData || !data || data.trending_skills.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center rounded-[12px] border border-dashed border-brand-hairline bg-brand-surface-soft p-6 text-center shadow-sm">
        <Briefcase className="h-8 w-8 text-brand-muted mb-3 opacity-40" />
        <h4 className="text-xs font-semibold text-brand-ink">No Market Demand Metrics</h4>
        <p className="text-[11px] text-brand-muted mt-1 max-w-[200px] leading-relaxed">
          Create active gigs or publish gig requirements to initiate semantic demand tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-brand-hairline bg-white p-5 flex flex-col h-[280px] shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
            AI Market Heatmap
            <span className="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] uppercase font-bold tracking-wider">Live</span>
          </h3>
          <p className="text-xs text-brand-muted mt-0.5">Live semantic demand mapping</p>
        </div>
        <BrainCircuit className="w-5 h-5 text-brand-primary" />
      </div>

      {/* AI Insight Box */}
      {data.insights[0] && (
        <div className="mb-4 rounded-[8px] bg-brand-surface-soft border border-brand-hairline p-3">
          <p className="text-xs font-medium text-brand-ink leading-relaxed flex items-start gap-2">
            <span className="text-brand-primary font-bold">AI:</span>
            {data.insights[0]}
          </p>
        </div>
      )}

      {/* Skills Grid */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {data.trending_skills.map((ts: any, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex items-center justify-between p-2 rounded-[8px] transition-all duration-200",
              ts.isMatch ? "bg-brand-primary/5 hover:bg-brand-primary/10" : "hover:bg-brand-surface-soft"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-brand-ink">{ts.skill}</span>
              {ts.isMatch && (
                <span className="px-1 py-0.5 rounded bg-brand-success/15 text-brand-success text-[8px] font-bold uppercase tracking-wide">
                  Your Skill
                </span>
              )}
            </div>
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

