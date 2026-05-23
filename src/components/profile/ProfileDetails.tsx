"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillTag, CategoryTag } from "./SkillTag";
import { StudentProfile } from "@/types/profile";

interface ProfileDetailsProps {
  profile: StudentProfile;
}

export function ProfileDetails({ profile }: ProfileDetailsProps) {
  return (
    <div className="space-y-4">
  
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">About</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {profile.bio ? (
            <p className="text-[14px] leading-[1.6] text-brand-body">{profile.bio}</p>
          ) : (
            <p className="text-[13px] text-brand-muted italic">No bio added yet. Edit your profile to introduce yourself.</p>
          )}
        </CardContent>
      </Card>

    
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Skills</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <SkillTag key={skill} label={skill} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-brand-muted italic">No skills added yet. Edit your profile to list your skills.</p>
          )}
        </CardContent>
      </Card>

    
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Preferred Work Categories</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {profile.preferredCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.preferredCategories.map((cat) => (
                <CategoryTag key={cat} label={cat} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-brand-muted italic">No categories selected yet. Edit your profile to set work preferences.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Portfolio Links</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {profile.portfolioLinks.length === 0 ? (
            <p className="text-[13px] text-brand-muted italic">No portfolio links added yet. Edit your profile to add links.</p>
          ) : (
            profile.portfolioLinks.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-[6px] border border-brand-hairline bg-brand-surface-soft px-3 py-2 text-[13px] text-brand-link transition-colors active:bg-brand-surface-strong"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{link}</span>
              </a>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
