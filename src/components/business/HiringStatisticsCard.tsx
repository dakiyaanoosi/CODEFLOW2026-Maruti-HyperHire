"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HiringPreferences } from "@/types/business";
import { Check } from "lucide-react";

interface HiringStatisticsCardProps {
  hiringPreferences: HiringPreferences;
  totalHires: number;
  jobsPosted: number;
}

export function HiringStatisticsCard({
  hiringPreferences,
  totalHires,
  jobsPosted,
}: HiringStatisticsCardProps) {
  const hiringRate = jobsPosted > 0 ? Math.round((totalHires / jobsPosted) * 100) : 0;

  const preferenceLabels: { key: keyof HiringPreferences; label: string }[] = [
    { key: "remote", label: "Remote" },
    { key: "partTime", label: "Part-time" },
    { key: "fullTime", label: "Full-time" },
    { key: "internship", label: "Internship" },
  ];

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-brand-hairline pb-3">
        <CardTitle className="text-[16px]">Hiring Statistics</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Hire rate bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-brand-body">Hire Rate</span>
            <span className="font-medium text-brand-ink">{hiringRate}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-surface-strong">
            <div
              className="h-full rounded-full bg-brand-success transition-all duration-500"
              style={{ width: `${hiringRate}%` }}
            />
          </div>
          <p className="text-[11px] text-brand-muted">
            {totalHires} hires from {jobsPosted} job posts
          </p>
        </div>

        <div className="border-t border-brand-hairline" />

        {/* Hiring preferences */}
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-brand-body">Hiring Preferences</p>
          <div className="flex flex-wrap gap-2">
            {preferenceLabels.map(({ key, label }) => (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[12px] font-medium ${
                  hiringPreferences[key]
                    ? "border-brand-success/30 bg-brand-success/10 text-brand-success"
                    : "border-brand-hairline bg-brand-surface-soft text-brand-muted line-through"
                }`}
              >
                {hiringPreferences[key] && <Check className="h-3 w-3 shrink-0" />}
                {label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
