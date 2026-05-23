"use client";

import * as React from "react";
import { MapPin, Users, DollarSign, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessVerificationBadge } from "./BusinessVerificationBadge";
import { BusinessProfile } from "@/types/business";

interface BusinessProfileCardProps {
  profile: BusinessProfile;
}

export function BusinessProfileCard({ profile }: BusinessProfileCardProps) {
  const logoInitials =
    profile.logoInitials ||
    (profile.companyName
      ? profile.companyName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "CO");

  const isVerified = profile.verificationStatus === "Verified" || !!profile.isVerified;
  const teamSize = profile.companySize || profile.teamSize || "1–10";

  return (
    <Card className="bg-white">
      <CardContent className="pt-6 space-y-5">
        {/* Logo + Name */}
        <div className="flex flex-col items-center text-center gap-3">
          {profile.logoUrl ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-[16px] border border-brand-hairline bg-brand-surface-soft">
              <img
                src={profile.logoUrl}
                alt={`${profile.companyName} logo`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-[16px] bg-brand-ink text-2xl font-semibold text-white select-none">
              {logoInitials}
            </div>
          )}

          <div>
            <h2 className="text-[20px] font-medium leading-[1.5] text-brand-ink">
              {profile.companyName}
            </h2>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-brand-muted">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {profile.industry}
            </div>
          </div>

          <BusinessVerificationBadge isVerified={isVerified} />
        </div>

        <div className="border-t border-brand-hairline" />

        {/* Key info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-brand-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Location
            </span>
            <span className="font-medium text-brand-ink">{profile.location}</span>
          </div>

          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-brand-muted">
              <Users className="h-3.5 w-3.5 shrink-0" />
              Team Size
            </span>
            <span className="font-medium text-brand-ink">{teamSize}</span>
          </div>

          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-brand-muted">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              Budget
            </span>
            <span className="font-medium text-brand-ink">{profile.budgetRange}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
