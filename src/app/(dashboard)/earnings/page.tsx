"use client";

import * as React from "react";
import { useAuthStore } from "@/store/use-auth-store";
import {
  IndianRupee,
  TrendingUp,
  Clock,
  Briefcase,
  BarChart2,
  Target,
} from "lucide-react";
import {
  EarningsStatCard,
  EarningsBarChart,
  PendingPayoutsTable,
  JobStatsGrid,
  ProjectCostsTable,
  HiringEfficiencyCard,
} from "@/components/earnings";
import { getStudentEarnings, getBusinessEarnings } from "@/lib/earnings-service";
import type { StudentEarningsSummary, BusinessEarningsSummary } from "@/types/earnings";

function StudentEarningsView({ data }: { data: StudentEarningsSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <EarningsStatCard
          label="Total Earnings"
          value={"₹" + data.totalEarnings.toLocaleString()}
          sub="All-time net"
          accent="bg-brand-peach"
          icon={<IndianRupee className="h-4 w-4 text-brand-ink" />}
        />
        <EarningsStatCard
          label="This Month"
          value={"₹" + data.currentMonthIncome.toLocaleString()}
          sub="May 2026"
          accent="bg-brand-mint"
          icon={<TrendingUp className="h-4 w-4 text-brand-ink" />}
        />
        <EarningsStatCard
          label="Pending Payout"
          value={"₹" + data.pendingPayoutTotal.toLocaleString()}
          sub={data.pendingPayouts.length + " transactions"}
          accent="bg-brand-yellow"
          icon={<Clock className="h-4 w-4 text-brand-ink" />}
        />
        <EarningsStatCard
          label="Completion Rate"
          value={data.completionRate + "%"}
          sub={"~₹" + data.avgRatePerHour + "/hr avg"}
          accent="bg-brand-cream"
          icon={<Briefcase className="h-4 w-4 text-brand-ink" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EarningsBarChart data={data.monthlyHistory} label="Monthly Income" unit="₹" />
        </div>
        <JobStatsGrid stats={data.jobStats} />
      </div>

      <PendingPayoutsTable payouts={data.pendingPayouts} />
    </div>
  );
}

function BusinessEarningsView({ data }: { data: BusinessEarningsSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <EarningsStatCard
          label="Total Spend"
          value={"₹" + data.totalSpend.toLocaleString()}
          sub="All-time outflow"
          accent="bg-brand-peach"
          icon={<IndianRupee className="h-4 w-4 text-brand-ink" />}
        />
        <EarningsStatCard
          label="This Month"
          value={"₹" + data.currentMonthSpend.toLocaleString()}
          sub="May 2026"
          accent="bg-brand-mint"
          icon={<TrendingUp className="h-4 w-4 text-brand-ink" />}
        />
        <EarningsStatCard
          label="Active Projects"
          value={String(data.activeProjectCount)}
          sub={data.hiredCount + " students hired"}
          accent="bg-brand-yellow"
          icon={<Briefcase className="h-4 w-4 text-brand-ink" />}
        />
        <EarningsStatCard
          label="Hiring Efficiency"
          value={data.hiringEfficiencyRate + "%"}
          sub={data.avgTimeToHire + "d avg to hire"}
          accent="bg-brand-cream"
          icon={<Target className="h-4 w-4 text-brand-ink" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EarningsBarChart data={data.monthlySpend} label="Monthly Spending" unit="₹" />
        </div>
        <HiringEfficiencyCard
          efficiencyRate={data.hiringEfficiencyRate}
          avgTimeToHire={data.avgTimeToHire}
          hiredCount={data.hiredCount}
          activeProjectCount={data.activeProjectCount}
        />
      </div>

      <ProjectCostsTable projects={data.projectCosts} />
    </div>
  );
}

export default function EarningsPage() {
  const { user, profile } = useAuthStore();
  const isBusiness = profile?.role === "business";

  const [studentData, setStudentData] = React.useState<StudentEarningsSummary | null>(null);
  const [businessData, setBusinessData] = React.useState<BusinessEarningsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const req = isBusiness
      ? getBusinessEarnings(user.uid).then((d) => setBusinessData(d))
      : getStudentEarnings(user.uid).then((d) => setStudentData(d));
    req.finally(() => setLoading(false));
  }, [user?.uid, isBusiness]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-normal leading-[1.2] tracking-normal text-brand-ink">
          {isBusiness ? "Spending Analytics" : "Earnings"}
        </h1>
        <p className="mt-2 text-sm font-normal leading-[1.25] text-brand-body">
          {isBusiness
            ? "Track project costs, hiring efficiency, and monthly spend."
            : "Monitor your income, pending payouts, and job performance."}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border border-brand-hairline bg-white py-24 gap-3">
          <BarChart2 className="h-6 w-6 text-brand-muted animate-pulse" />
          <p className="text-sm text-brand-muted">Loading dashboard…</p>
        </div>
      ) : isBusiness && businessData ? (
        <BusinessEarningsView data={businessData} />
      ) : !isBusiness && studentData ? (
        <StudentEarningsView data={studentData} />
      ) : null}
    </div>
  );
}
