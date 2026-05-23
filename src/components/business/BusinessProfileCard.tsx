"use client";

import * as React from "react";
import { MapPin, Users, DollarSign, Building2, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessVerificationBadge } from "./BusinessVerificationBadge";
import { BusinessProfile } from "@/types/business";

interface BusinessProfileCardProps {
  profile: BusinessProfile;
  isEditing?: boolean;
  onLogoClick?: () => void;
}

export function BusinessProfileCard({ profile, isEditing = false, onLogoClick }: BusinessProfileCardProps) {
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
          <div className="relative group">
            {isEditing ? (
              <button
                type="button"
                onClick={onLogoClick}
                className="relative flex h-20 w-20 items-center justify-center rounded-[16px] overflow-hidden border border-brand-hairline bg-brand-surface-soft cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary"
                title="Change company logo"
              >
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={`${profile.companyName} logo`}
                    className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-70"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white bg-brand-ink select-none transition-opacity duration-200 group-hover:opacity-70">
                    {logoInitials}
                  </div>
                )}
                {/* Camera overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </button>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-[16px] overflow-hidden border border-brand-hairline bg-brand-surface-soft select-none">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={`${profile.companyName} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-white bg-brand-ink flex h-full w-full items-center justify-center">
                    {logoInitials}
                  </span>
                )}
              </div>
            )}
          </div>

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
