"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SkillTag, CategoryTag } from "./SkillTag";
import { StudentProfile } from "@/types/profile";

interface ProfileDetailsProps {
  profile: StudentProfile;
}

export function ProfileDetails({ profile }: ProfileDetailsProps) {
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
          <div className="space-y-2 pt-5">
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
        </CardContent>
      </Card>
    </div>
  );
}
