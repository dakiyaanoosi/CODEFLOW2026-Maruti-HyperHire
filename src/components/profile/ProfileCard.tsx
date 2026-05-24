"use client";

import * as React from "react";
import { Globe, DollarSign, Clock, GraduationCap, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { ProfileStrengthMeter } from "./ProfileStrengthMeter";
import { VerificationBadge } from "./VerificationBadge";
import { StudentProfile } from "@/types/profile";

interface ProfileCardProps {
  profile: StudentProfile;
  isEditing?: boolean;
  onAvatarClick?: () => void;
}

export function ProfileCard({ profile, isEditing = false, onAvatarClick }: ProfileCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="pt-6 space-y-5">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative group">
            {isEditing ? (
              <button
                type="button"
                onClick={onAvatarClick}
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary overflow-hidden border border-brand-hairline group cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary"
                title="Change profile picture"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.name} avatar`}
                    className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-70"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-white select-none transition-opacity duration-200 group-hover:opacity-70">
                    {profile.avatarInitials}
                  </div>
                )}
                {/* Camera overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </button>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary border border-brand-hairline overflow-hidden select-none">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.name} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium text-white">
                    {profile.avatarInitials}
                  </span>
                )}
              </div>
            )}
            {profile.isVerified && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-info text-white ring-2 ring-white z-10">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
              </span>
            )}
          </div>

          <div>
            <h2 className="text-[20px] font-medium leading-[1.5] text-brand-ink">
              {profile.name}
            </h2>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-brand-muted">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              {profile.college}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <ConfidenceIndicator score={profile.trustScore} rank="Bronze" />
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-hairline bg-white text-brand-muted hover:text-brand-ink transition-colors active:bg-brand-surface-soft"
                aria-label="GitHub"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
            )}

            {profile.socialLinks.linkedin && (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-hairline bg-white text-brand-muted hover:text-[#0077b5] transition-colors active:bg-brand-surface-soft"
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            )}

            {profile.socialLinks.twitter && (
              <a
                href={profile.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-hairline bg-white text-brand-muted hover:text-brand-ink transition-colors active:bg-brand-surface-soft"
                aria-label="Twitter / X"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}

            {profile.socialLinks.website && (
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-hairline bg-white text-brand-muted hover:text-brand-ink transition-colors active:bg-brand-surface-soft"
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
