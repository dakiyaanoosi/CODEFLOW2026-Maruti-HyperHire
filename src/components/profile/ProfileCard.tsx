"use client";

import * as React from "react";
import { Github, Globe, Linkedin, Twitter, DollarSign, Clock, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrustScoreBadge } from "./TrustScoreBadge";
import { ProfileStrengthMeter } from "./ProfileStrengthMeter";
import { VerificationBadge } from "./VerificationBadge";
import { StudentProfile } from "@/types/profile";

interface ProfileCardProps {
  profile: StudentProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="pt-6 space-y-5">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary text-2xl font-medium text-white select-none">
              {profile.avatarInitials}
            </div>
            {profile.isVerified && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-info text-white ring-2 ring-white">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
              </span>
            )}
          </div>

          <div>
            <h2 className="text-[20px] font-medium leading-[1.5] text-brand-ink">
              Generic User
            </h2>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-brand-muted">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              {profile.college}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <TrustScoreBadge score={profile.trustScore} />
            <VerificationBadge isVerified={profile.isVerified} />
          </div>
        </div>

        <div className="border-t border-brand-hairline" />

        <ProfileStrengthMeter strength={profile.profileStrength} />

        <div className="border-t border-brand-hairline" />

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-brand-muted">
              <DollarSign className="h-3.5 w-3.5" />
              Hourly Rate
            </span>
            <span className="font-medium text-brand-ink">${profile.hourlyRate}/hr</span>
          </div>

          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-brand-muted">
              <Clock className="h-3.5 w-3.5" />
              Availability
            </span>
            <span className="font-medium text-brand-ink">{profile.availability}</span>
          </div>

          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-brand-muted">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" />
              </svg>
              Experience
            </span>
            <span className="font-medium text-brand-ink">{profile.experienceLevel}</span>
          </div>
        </div>

        <div className="border-t border-brand-hairline" />

        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16px] text-brand-muted">
            Connect
          </p>
          <div className="flex gap-2">
            {profile.socialLinks.github && (
              <a
                href={profile.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-hairline bg-white text-brand-muted transition-colors active:bg-brand-surface-soft active:text-brand-ink"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            )}

            {profile.socialLinks.linkedin && (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-hairline bg-white text-brand-muted transition-colors active:bg-brand-surface-soft active:text-brand-ink"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}

            {profile.socialLinks.twitter && (
              <a
                href={profile.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-hairline bg-white text-brand-muted transition-colors active:bg-brand-surface-soft active:text-brand-ink"
                aria-label="Twitter / X"
              >
                <Twitter className="h-4 w-4" />
              </a>
            )}

            {profile.socialLinks.website && (
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-hairline bg-white text-brand-muted transition-colors active:bg-brand-surface-soft active:text-brand-ink"
                aria-label="Website"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}