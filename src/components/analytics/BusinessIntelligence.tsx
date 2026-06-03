"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { analyticsService, BusinessAnalytics } from "@/lib/analytics-service";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from "recharts";
import { 
  Loader2, TrendingUp, Users, CheckCircle, Briefcase, Wallet, 
  Clock, AlertTriangle, UserCheck, BarChart2, ShieldAlert, Star
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BusinessIntelligence() {
  const { user } = useAuthStore();
  const [data, setData] = React.useState<BusinessAnalytics | null>(null);

  React.useEffect(() => {
    if (!user) return;
    return analyticsService.subscribeToBusinessAnalytics(user.uid, setData);
  }, [user]);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[12px] border border-brand-hairline bg-white shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-xs text-brand-muted">Aggregating workforce operations...</p>
        </div>
      </div>
    );
  }

  // Check if the business has absolutely zero activity
  const isBrandNew = 
    data.totalJobs === 0 && 
    data.totalApplicationsReceived === 0 && 
    data.activeWorkflows === 0 && 
    data.releasedPayouts === 0;

  if (isBrandNew) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-brand-hairline bg-brand-surface-soft p-12 text-center shadow-sm">
        <Briefcase className="h-10 w-10 text-brand-primary mb-4 animate-pulse" />
        <h3 className="text-base font-semibold text-brand-ink">Business Operations Dashboard</h3>
        <p className="text-xs text-brand-muted mt-2 max-w-md leading-relaxed">
          Monitor your hiring funnel pipelines, active project milestones, spending trends, and top student talent collaborators. Publish your first gig to populate this workspace.
        </p>
        <div className="mt-6">
          <a 
            href="/jobs" 
            className="rounded-[8px] bg-brand-ink px-4 py-2 text-xs font-semibold text-white hover:bg-brand-primary-active transition-colors cursor-pointer"
          >
            Post a Gig
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ─── HIRING INTELLIGENCE KPI ROW ─── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KPICard label="Active Gigs" value={data.activeGigs} icon={Briefcase} />
        <KPICard label="Apps Received" value={data.applicationsReceived} icon={Users} />
        <KPICard label="Accepted Hires" value={data.acceptedHires} icon={CheckCircle} highlight={data.acceptedHires > 0} />
        <KPICard label="Avg Proposal Match" value={`${data.averageProposalQuality}%`} icon={TrendingUp} />
        <KPICard label="Workflows Finished" value={data.completedWorkflows} icon={CheckCircle} />
        <KPICard label="Student Rating" value={data.reviewCount > 0 ? `${data.averageCollaborationRating.toFixed(1)} ★` : "—"} icon={Star} highlight={data.averageCollaborationRating >= 4.5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ─── SPENDING INTELLIGENCE & FUNNEL (2 cols) ─── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Spending Intelligence Card */}
          <div className="rounded-[12px] border border-brand-hairline bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-brand-primary" />
                  Spending Intelligence
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">Escrowed project budgets and payment release logs.</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] uppercase font-bold tracking-wider">
                Financial Audit
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-[8px] bg-brand-surface-soft p-3">
                <p className="text-[10px] font-medium text-brand-muted uppercase">Escrowed Funds</p>
                <p className="text-xl font-bold text-brand-ink mt-1">₹{data.escrowedFunds.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-[8px] bg-brand-surface-soft p-3">
                <p className="text-[10px] font-medium text-brand-muted uppercase">Released Payouts</p>
                <p className="text-xl font-bold text-brand-success mt-1">₹{data.releasedPayouts.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Spend Trend Chart */}
            <p className="text-[10px] font-bold uppercase text-brand-muted mb-3">Spend Progression Trend</p>
            <div className="h-[180px] w-full">
              {data.releasedPayouts === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <BarChart2 className="w-6 h-6 text-brand-muted mb-2 opacity-50" />
                  <p className="text-xs text-brand-muted">No payout events recorded to show progression.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlySpendTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.08}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#666" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#666" }} />
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
                      stroke="#3B82F6" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorSpend)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Funnel Chart */}
          <div className="rounded-[12px] border border-brand-hairline bg-white p-5 shadow-sm">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-brand-primary" />
                Hiring Funnel Velocity
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Conversion drop-off from gig creation to workspace delivery.
              </p>
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnelData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#666" }} 
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-[8px] border border-brand-hairline bg-white px-3 py-2 shadow-sm">
                            <p className="text-xs font-semibold text-brand-ink">{payload[0].payload.name}</p>
                            <p className="text-sm font-bold text-brand-primary mt-0.5">{payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {data.funnelData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === data.funnelData.length - 1 ? "#000" : "#E2E2E2"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ─── WORKFORCE INTELLIGENCE & RISKS (1 col) ─── */}
        <div className="space-y-6">
          
          {/* Top Performing Collaborators */}
          <div className="rounded-[12px] border border-brand-hairline bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-brand-primary" />
              Collaborator Network
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">Top-performing student partners based on workflows completed.</p>
            
            {data.topPerformingCollaborators.length === 0 ? (
              <p className="text-xs text-brand-muted text-center py-6">No collaborators recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {data.topPerformingCollaborators.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-[8px] bg-brand-surface-soft border border-brand-hairline">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-brand-ink text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {c.name.split(" ").map(n => n[0]).join("")}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-brand-ink truncate leading-normal">{c.name}</p>
                        <p className="text-[10px] text-brand-muted leading-tight">Trust Score: {c.trustScore}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold text-brand-ink">{c.completedCount}</p>
                      <p className="text-[9px] text-brand-muted">Done</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operational Risks & Revision Heavy Projects */}
          <div className="rounded-[12px] border border-brand-hairline bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-brand-primary" />
              Workspace Risk Metrics
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-brand-surface-soft p-3 border border-brand-hairline">
                <p className="text-[9px] font-bold text-brand-muted uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-brand-warning shrink-0" />
                  Delayed Gigs
                </p>
                <p className="text-xl font-bold text-brand-ink mt-1.5">{data.delayedProjects}</p>
              </div>
              <div className="rounded-[8px] bg-brand-surface-soft p-3 border border-brand-hairline">
                <p className="text-[9px] font-bold text-brand-muted uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-brand-warning shrink-0" />
                  Completion
                </p>
                <p className="text-xl font-bold text-brand-ink mt-1.5">{data.workflowCompletionRate}%</p>
              </div>
            </div>

            <div className="border-t border-brand-hairline pt-4">
              <p className="text-[10px] font-bold uppercase text-brand-muted mb-2">Revision Heavy Projects</p>
              {data.revisionHeavyProjects.length === 0 ? (
                <p className="text-xs text-brand-muted text-center py-4">No revision loops tracked.</p>
              ) : (
                <div className="space-y-2">
                  {data.revisionHeavyProjects.map((proj, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-brand-surface-soft">
                      <span className="text-brand-ink font-medium truncate max-w-[160px]">{proj.title}</span>
                      <span className="text-[10px] text-brand-warning font-bold uppercase bg-brand-warning/10 px-1.5 py-0.5 rounded">
                        {proj.count} revisions
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

function KPICard({ label, value, icon: Icon, highlight }: { label: string, value: string | number, icon: any, highlight?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[10px] border border-brand-hairline bg-white p-4 flex flex-col shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className={cn("w-4 h-4", highlight ? "text-brand-success" : "text-brand-muted")} />
      </div>
      <p className="text-2xl font-bold text-brand-ink leading-none">{value}</p>
      <p className="text-[11px] font-medium text-brand-muted mt-1.5">{label}</p>
    </motion.div>
  );
}
