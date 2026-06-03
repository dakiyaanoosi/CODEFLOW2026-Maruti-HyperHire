"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ExternalLink } from "lucide-react";
import { ActivityAnalyticsCard } from "./ActivityAnalyticsCard";
import { HiringStatisticsCard } from "./HiringStatisticsCard";
import { BusinessProfile } from "@/types/business";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BusinessProfileDetailsProps {
  profile: BusinessProfile;
}

export function BusinessProfileDetails({ profile }: BusinessProfileDetailsProps) {
  // Compute analytics metrics from profile fields
  const jobsPosted = profile.activeJobs ?? profile.analytics?.jobsPosted ?? 0;
  const totalHires = profile.totalHires ?? profile.analytics?.totalHires ?? 0;
  const activeListings = profile.activeJobs ?? profile.analytics?.activeListings ?? 0;

  const [avgResponseHours, setAvgResponseHours] = React.useState<number>(0);

  React.useEffect(() => {
    async function calculateResponseTime() {
      if (!profile.ownerId) return;
      try {
        if (!db) {
          setAvgResponseHours(0);
          return;
        }

        const q = query(
          collection(db, "applications"),
          where("businessId", "==", profile.ownerId)
        );
        const snap = await getDocs(q);
        const apps = snap.docs.map((d) => d.data());

        const respondedApps = apps.filter(
          (a) => a.status !== "pending" && a.createdAt && a.updatedAt
        );

        if (respondedApps.length > 0) {
          let totalMs = 0;
          respondedApps.forEach((a) => {
            const start = new Date(a.createdAt).getTime();
            const end = new Date(a.updatedAt).getTime();
            totalMs += Math.max(0, end - start);
          });
          const avgHours = totalMs / respondedApps.length / (1000 * 60 * 60);
          setAvgResponseHours(Math.max(1, Math.round(avgHours)));
        } else {
          setAvgResponseHours(0);
        }
      } catch (e) {
        console.error("Error calculating response time:", e);
        setAvgResponseHours(0);
      }
    }
    calculateResponseTime();
  }, [profile.ownerId]);

  const resolvedAnalytics = {
    jobsPosted,
    totalHires,
    activeListings,
    avgResponseHours,
  };

  return (
    <div className="space-y-4">
      {/* About */}
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">About</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-[14px] leading-[1.6] text-brand-body whitespace-pre-wrap">
            {profile.description || "No company description provided yet."}
          </p>

          {profile.website && (
            <div className="pt-3 border-t border-brand-hairline flex items-center gap-2 text-[14px]">
              <Globe className="h-4 w-4 text-brand-muted shrink-0" />
              <span className="text-brand-muted font-medium">Website:</span>
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-link hover:underline font-semibold flex items-center gap-1"
              >
                {profile.website.replace(/^https?:\/\/(www\.)?/, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Analytics */}
      <ActivityAnalyticsCard analytics={resolvedAnalytics} />

      {/* Hiring Statistics */}
      <HiringStatisticsCard
        hiringPreferences={profile.hiringPreferences}
        totalHires={totalHires}
        jobsPosted={jobsPosted}
      />
    </div>
  );
}
