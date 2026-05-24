"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { analyticsService, BusinessAnalytics } from "@/lib/analytics-service";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Loader2, TrendingUp, Users, CheckCircle, Briefcase } from "lucide-react";
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
      <div className="flex h-48 items-center justify-center rounded-[12px] border border-brand-hairline bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  // If no data exists, show an empty state instead of 0s
  if (data.totalJobs === 0 && data.totalApplicationsReceived === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-[12px] border border-dashed border-brand-hairline bg-brand-surface-soft p-6 text-center">
        <Briefcase className="h-8 w-8 text-brand-muted mb-3 opacity-50" />
        <h3 className="text-sm font-semibold text-brand-ink">No Hiring Data Yet</h3>
        <p className="text-xs text-brand-muted mt-1 max-w-sm">
          Post your first gig to start gathering intelligence on applicant quality and funnel conversion rates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Jobs" value={data.totalJobs} icon={Briefcase} />
        <KPICard label="Applicants" value={data.totalApplicationsReceived} icon={Users} />
        <KPICard label="Accepted" value={data.acceptedApplications} icon={CheckCircle} />
        <KPICard 
          label="Conversion" 
          value={`${Math.round(data.conversionRate)}%`} 
          icon={TrendingUp} 
          highlight={data.conversionRate > 20}
        />
      </div>

      {/* Funnel Chart */}
      <div className="rounded-[12px] border border-brand-hairline bg-white p-5">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-brand-ink">Hiring Funnel Velocity</h3>
          <p className="text-xs text-brand-muted mt-1">
            Conversion drop-off from job posting to workflow completion.
          </p>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.funnelData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "#666" }} 
                dy={10}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.02)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-[8px] border border-brand-hairline bg-white px-3 py-2 shadow-sm">
                        <p className="text-xs font-semibold text-brand-ink">{payload[0].payload.name}</p>
                        <p className="text-sm text-brand-ink">{payload[0].value}</p>
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
  );
}

function KPICard({ label, value, icon: Icon, highlight }: { label: string, value: string | number, icon: any, highlight?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[10px] border border-brand-hairline bg-white p-4 flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className={cn("w-4 h-4", highlight ? "text-brand-success" : "text-brand-muted")} />
      </div>
      <p className="text-2xl font-semibold text-brand-ink leading-none">{value}</p>
      <p className="text-xs font-medium text-brand-muted mt-1">{label}</p>
    </motion.div>
  );
}
