"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityAnalyticsCard } from "./ActivityAnalyticsCard";
import { HiringStatisticsCard } from "./HiringStatisticsCard";
import { BusinessProfile } from "@/types/business";

interface BusinessProfileDetailsProps {
  profile: BusinessProfile;
}

export function BusinessProfileDetails({ profile }: BusinessProfileDetailsProps) {
  return (
    <div className="space-y-4">
      {/* About */}
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">About</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-[14px] leading-[1.6] text-brand-body">{profile.description}</p>
        </CardContent>
      </Card>

      {/* Activity Analytics */}
      <ActivityAnalyticsCard analytics={profile.analytics} />

      {/* Hiring Statistics */}
      <HiringStatisticsCard
        hiringPreferences={profile.hiringPreferences}
        totalHires={profile.analytics.totalHires}
        jobsPosted={profile.analytics.jobsPosted}
      />
    </div>
  );
}
