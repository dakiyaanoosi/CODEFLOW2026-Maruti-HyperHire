"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { analyticsService, StudentAnalytics } from "@/lib/analytics-service";
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from "recharts";
import { 
  Loader2, TrendingUp, CheckCircle, Activity, Wallet, ShieldCheck, 
  Briefcase, Award, Calendar, ChevronRight, Eye, Sparkles, AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StudentIntelligence() {
  const { user } = useAuthStore();
  const [data, setData] = React.useState<StudentAnalytics | null>(null);

  React.useEffect(() => {
    if (!user) return;
    return analyticsService.subscribeToStudentAnalytics(user.uid, setData);
  }, [user]);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[12px] border border-brand-hairline bg-white shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-xs text-brand-muted">Aggregating workspace analytics...</p>
        </div>
      </div>
    );
  }

  // 1. Check if the student has absolutely zero activity
  const isBrandNew = 
    data.totalApplications === 0 && 
    data.activeWorkflows === 0 && 
    data.completedWorkflows === 0 && 
    data.totalEarned === 0 && 
    data.portfolioCount === 0;

  if (isBrandNew) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-brand-hairline bg-brand-surface-soft p-12 text-center shadow-sm">
        <Sparkles className="h-10 w-10 text-brand-primary mb-4 animate-pulse" />
        <h3 className="text-base font-semibold text-brand-ink">Your HyperHire Intelligence Hub</h3>
        <p className="text-xs text-brand-muted mt-2 max-w-md leading-relaxed">
          Unlock productivity statistics, live trust score mapping, and escrow/earnings analytics. Send your first application or create a portfolio item to activate this panel.
        </p>
        <div className="mt-6 flex gap-3">
          <a 
            href="/marketplace" 
            className="rounded-[8px] bg-brand-ink px-4 py-2 text-xs font-semibold text-white hover:bg-brand-primary-active transition-colors cursor-pointer"
          >
            Find Gigs
          </a>
          <a 
            href="/portfolio" 
            className="rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-xs font-semibold text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
          >
            Create Portfolio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ─── PRODUCTIVITY OVERVIEW ─── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          Productivity Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KPICard label="Active Workflows" value={data.activeWorkflows} icon={Activity} />
          <KPICard label="Workflows Done" value={data.completedWorkflows} icon={CheckCircle} highlight={data.completedWorkflows > 0} />
          <KPICard label="Tasks Completed" value={data.tasksCompleted} icon={ShieldCheck} />
          <KPICard label="Revision Count" value={data.revisionCount} icon={Briefcase} highlight={data.revisionCount > 3} highlightColor="text-brand-warning" />
          <KPICard label="Completion Speed" value={data.averageCompletionSpeed} icon={TrendingUp} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ─── EARNINGS INTELLIGENCE (2 cols) ─── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[12px] border border-brand-hairline bg-white p-5 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-brand-primary" />
                  Earnings Intelligence
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">Real-time escrow transactions and monthly growth.</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-brand-success/10 text-brand-success text-[10px] uppercase font-bold tracking-wider">
                Escrow Locked
              </span>
            </div>

            {/* Escrow KPI Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-[8px] bg-brand-surface-soft p-3">
                <p className="text-[10px] font-medium text-brand-muted uppercase">Total Earned</p>
                <p className="text-lg font-bold text-brand-ink mt-1">₹{data.totalEarned.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-[8px] bg-brand-surface-soft p-3">
                <p className="text-[10px] font-medium text-brand-muted uppercase">Pending Escrow</p>
                <p className="text-lg font-bold text-brand-muted mt-1">₹{data.pendingEscrow.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-[8px] bg-brand-surface-soft p-3">
                <p className="text-[10px] font-medium text-brand-muted uppercase">Released Escrow</p>
                <p className="text-lg font-bold text-brand-success mt-1">₹{data.releasedEscrow.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Earnings Chart */}
            <div className="h-[200px] w-full">
              {data.totalEarned === 0 && data.pendingEscrow === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="w-6 h-6 text-brand-muted mb-2 opacity-50" />
                  <p className="text-xs text-brand-muted">No active or released escrow transactions found.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyEarningsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarning" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={0.06}/>
                        <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "#666" }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "#666" }} 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-[8px] border border-brand-hairline bg-white px-3 py-2 shadow-md">
                              <p className="text-[10px] font-bold text-brand-muted">
                                {payload[0].payload.month} {payload[0].payload.year}
                              </p>
                              <p className="text-sm font-semibold text-brand-ink mt-0.5">
                                ₹{payload[0].value?.toLocaleString("en-IN")}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#000000" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorEarning)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ─── AI MARKET DEMAND ─── */}
          <div className="rounded-[12px] border border-brand-hairline bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-brand-primary" />
                  AI Market Demand
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Real-time gig aggregations. Verified categories.
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-success flex items-center gap-1">
                Trend: {data.demandTrend}
              </span>
            </div>

            {data.mostRequestedSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs text-brand-muted">No published active jobs to calculate market demand.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase text-brand-muted mb-3">Top Requested Skills</p>
                  <div className="space-y-3.5">
                    {data.mostRequestedSkills.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-brand-ink">{item.skill}</span>
                          <span className="text-brand-muted">{item.count} gigs</span>
                        </div>
                        <div className="h-1 bg-brand-surface-soft rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-ink rounded-full" 
                            style={{ width: `${Math.min(100, (item.count / data.mostRequestedSkills[0].count) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase text-brand-muted mb-3">Top Job Categories</p>
                  <div className="space-y-3.5">
                    {data.matchingCategories.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-brand-ink">{item.category}</span>
                          <span className="text-brand-muted">{item.count} jobs</span>
                        </div>
                        <div className="h-1 bg-brand-surface-soft rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-primary rounded-full" 
                            style={{ width: `${Math.min(100, (item.count / data.matchingCategories[0].count) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── TRUST INTELLIGENCE (1 col) ─── */}
        <div className="space-y-6">
          <div className="rounded-[12px] border border-brand-hairline bg-white p-5 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-brand-primary" />
                  Trust Intelligence
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">Live trust score changes and ranks.</p>
              </div>
            </div>

            {/* Score & Badge Circle */}
            <div className="flex items-center gap-4 py-3 border-b border-brand-hairline mb-4">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-[3px] border-brand-ink/10 bg-brand-surface-soft">
                <span className="text-xl font-bold text-brand-ink">{data.currentTrustScore}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-ink">Rank: {data.trustRank}</p>
                <p className="text-[11px] text-brand-muted mt-0.5">Calculated using decaying historical interaction score.</p>
              </div>
            </div>

            {/* Trust Growth Graph */}
            <p className="text-[10px] font-bold uppercase text-brand-muted mb-2">Trust Growth Trend</p>
            <div className="h-[120px] w-full mb-4">
              {data.trustGrowthTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-xs text-brand-muted">No trust score events logged yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trustGrowthTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: "#888" }} 
                    />
                    <YAxis 
                      domain={[50, 100]}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: "#888" }} 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-[8px] border border-brand-hairline bg-white px-2 py-1 shadow">
                              <p className="text-[9px] font-bold text-brand-muted">{payload[0].payload.date}</p>
                              <p className="text-xs font-semibold text-brand-ink">Score: {payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#000" 
                      strokeWidth={1.5}
                      dot={{ r: 2, stroke: "#000", strokeWidth: 1, fill: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent Changes List */}
            <p className="text-[10px] font-bold uppercase text-brand-muted mb-2">Recent Trust Changes</p>
            {data.recentTrustChanges.length === 0 ? (
              <p className="text-xs text-brand-muted text-center py-4">No recent trust updates.</p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {data.recentTrustChanges.map((event, idx) => (
                  <div key={idx} className="flex items-start justify-between p-2 rounded bg-brand-surface-soft text-xs">
                    <div className="space-y-0.5 pr-2">
                      <p className="font-semibold text-brand-ink leading-tight">{event.reason}</p>
                      <p className="text-[10px] text-brand-muted flex items-center gap-1 uppercase">
                        <span>{event.dimension}</span>
                        <span>•</span>
                        <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <span 
                      className={cn(
                        "font-bold",
                        event.impactScore >= 0 ? "text-brand-success" : "text-brand-warning"
                      )}
                    >
                      {event.impactScore >= 0 ? `+${event.impactScore}` : event.impactScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── PORTFOLIO INTELLIGENCE ─── */}
          <div className="rounded-[12px] border border-brand-hairline bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-primary" />
              Portfolio Intelligence
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-brand-surface-soft p-3">
                <p className="text-[10px] font-medium text-brand-muted uppercase">Portfolio Projects</p>
                <p className="text-xl font-bold text-brand-ink mt-1">{data.portfolioCount}</p>
              </div>
              <div className="rounded-[8px] bg-brand-surface-soft p-3">
                <p className="text-[10px] font-medium text-brand-muted uppercase">Verified Works</p>
                <p className="text-xl font-bold text-brand-success mt-1">{data.verifiedWorkCount}</p>
              </div>
            </div>
            
            <div className="rounded-[8px] border border-brand-hairline p-3">
              <p className="text-[9px] font-semibold uppercase text-brand-muted">Most Viewed Project</p>
              <p className="text-xs font-semibold text-brand-ink mt-1 truncate">{data.mostViewedProject}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-brand-muted">
              <span>Workflow-generated entries:</span>
              <span className="font-semibold text-brand-ink">{data.completionGeneratedPortfolioEntries}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

function KPICard({ 
  label, 
  value, 
  icon: Icon, 
  highlight, 
  highlightColor = "text-brand-success" 
}: { 
  label: string, 
  value: string | number, 
  icon: any, 
  highlight?: boolean,
  highlightColor?: string 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[10px] border border-brand-hairline bg-white p-4 flex flex-col shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className={cn("w-4 h-4", highlight ? highlightColor : "text-brand-muted")} />
      </div>
      <p className="text-2xl font-bold text-brand-ink leading-none">{value}</p>
      <p className="text-[11px] font-medium text-brand-muted mt-1.5">{label}</p>
    </motion.div>
  );
}

