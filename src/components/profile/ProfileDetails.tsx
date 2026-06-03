"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SkillTag, CategoryTag } from "./SkillTag";
import { StudentProfile } from "@/types/profile";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

interface ProfileDetailsProps {
  profile: StudentProfile;
  userId: string;
}

export function ProfileDetails({ profile, userId }: ProfileDetailsProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-white">
        <CardContent className="p-6 divide-y divide-brand-hairline space-y-5">
          {/* About Section */}
          <div className="space-y-2 pb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">About</h3>
            {profile.bio ? (
              <p className="text-sm leading-relaxed text-brand-body">{profile.bio}</p>
            ) : (
              <p className="text-xs text-brand-muted italic">No bio added yet. Edit your profile to introduce yourself.</p>
            )}
          </div>

          {/* Skills Section */}
          <div className="space-y-2 pt-5 pb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">Skills</h3>
            {profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <SkillTag key={skill} label={skill} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-muted italic">No skills added yet. Edit your profile to list your skills.</p>
            )}
          </div>

          {/* Preferred Work Categories Section */}
          <div className="space-y-2 pt-5 pb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">Preferred Work Categories</h3>
            {profile.preferredCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.preferredCategories.map((cat) => (
                  <CategoryTag key={cat} label={cat} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-muted italic">No categories selected yet. Edit your profile to set work preferences.</p>
            )}
          </div>

          {/* Reputation Highlights */}
          <div className="space-y-3 pt-5 pb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">Collaboration Reputation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-brand-surface-soft p-4 rounded-xl border border-brand-hairline">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wide">Repeat Client Rate</p>
                <p className="text-2xl font-semibold text-brand-ink mt-1.5">
                  {profile.repeatClientRate !== undefined ? `${profile.repeatClientRate}%` : "0%"}
                </p>
                <p className="text-[11px] text-brand-muted mt-1 leading-normal">Percentage of clients returning for multiple projects.</p>
              </div>
              <div className="bg-brand-surface-soft p-4 rounded-xl border border-brand-hairline">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wide">Verified Projects</p>
                <p className="text-2xl font-semibold text-brand-success mt-1.5">
                  {profile.verifiedProjectsCount !== undefined ? profile.verifiedProjectsCount : 0}
                </p>
                <p className="text-[11px] text-brand-muted mt-1 leading-normal">Proof-of-work achievements completed and paid via Escrow.</p>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3 pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">Client Feedback</h3>
            <ReviewsSection userId={userId} role="student" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
