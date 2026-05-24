"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { analyticsService, StudentAnalytics } from "@/lib/analytics-service";
import { Loader2, TrendingUp, Send, CheckCircle, Activity } from "lucide-react";
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
      <div className="flex h-48 items-center justify-center rounded-[12px] border border-brand-hairline bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
      </div>
    );
  }

  // If no data exists, show an empty state
  if (data.totalApplications === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-[12px] border border-dashed border-brand-hairline bg-brand-surface-soft p-6 text-center">
        <Send className="h-8 w-8 text-brand-muted mb-3 opacity-50" />
        <h3 className="text-sm font-semibold text-brand-ink">No Applications Yet</h3>
        <p className="text-xs text-brand-muted mt-1 max-w-sm">
          Send your first application to start tracking your acceptance rate and execution velocity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Sent Proposals" value={data.totalApplications} icon={Send} />
        <KPICard label="Accepted" value={data.acceptedApplications} icon={CheckCircle} />
        <KPICard 
          label="Acceptance Rate" 
          value={`${Math.round(data.acceptanceRate)}%`} 
          icon={TrendingUp} 
          highlight={data.acceptanceRate >= 50}
        />
        <KPICard label="Active Workflows" value={data.activeWorkflows} icon={Activity} />
      </div>

      {/* Insight Bar */}
      <div className="rounded-[12px] border border-brand-hairline bg-white p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink">Execution Velocity</h3>
          <p className="text-xs text-brand-muted mt-1">
            Ratio of completed vs active workflows.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-brand-ink">{data.completedWorkflows}</p>
          <p className="text-xs text-brand-muted">Total Completed</p>
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
