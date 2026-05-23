"use client";

import * as React from "react";
import { Briefcase, Users, ListChecks, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityAnalytics } from "@/types/business";

interface ActivityAnalyticsCardProps {
  analytics: ActivityAnalytics;
}

const stats = [
  {
    key: "jobsPosted" as const,
    label: "Jobs Posted",
    icon: Briefcase,
    color: "text-brand-info",
    bg: "bg-brand-info/10",
  },
  {
    key: "totalHires" as const,
    label: "Total Hires",
    icon: Users,
    color: "text-brand-success",
    bg: "bg-brand-success/10",
  },
  {
    key: "activeListings" as const,
    label: "Active Listings",
    icon: ListChecks,
    color: "text-brand-coral",
    bg: "bg-brand-coral/10",
  },
  {
    key: "avgResponseHours" as const,
    label: "Avg. Response",
    icon: Clock,
    color: "text-brand-mustard",
    bg: "bg-brand-mustard/10",
    suffix: "h",
  },
];

export function ActivityAnalyticsCard({ analytics }: ActivityAnalyticsCardProps) {
  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-brand-hairline pb-3">
        <CardTitle className="text-[16px]">Activity Analytics</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ key, label, icon: Icon, color, bg, suffix }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-3"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-[18px] font-medium leading-[1.2] text-brand-ink">
                  {analytics[key]}{suffix ?? ""}
                </p>
                <p className="text-[11px] text-brand-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
