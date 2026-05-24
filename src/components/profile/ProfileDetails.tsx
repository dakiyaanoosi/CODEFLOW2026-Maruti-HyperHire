"use client";

import * as React from "react";
import { ExternalLink, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillTag, CategoryTag } from "./SkillTag";
import { StudentProfile } from "@/types/profile";

interface ProfileDetailsProps {
  profile: StudentProfile;
}

export function ProfileDetails({ profile }: ProfileDetailsProps) {
  type IconProps = React.SVGProps<SVGSVGElement>;
  const socialLinks = [
    {
      label: "GitHub",
      href: profile.socialLinks.github,
      icon: (props: IconProps) => (
        <svg {...props} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      href: profile.socialLinks.linkedin,
      icon: (props: IconProps) => (
        <svg {...props} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      ),
    },
    {
      label: "Twitter / X",
      href: profile.socialLinks.twitter,
      icon: (props: IconProps) => (
        <svg {...props} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      label: "Website",
      href: profile.socialLinks.website,
      icon: (props: IconProps) => <Globe {...props} />,
    },
  ].filter((item) => item.href);

  return (
    <div className="space-y-4">
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">About</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 min-h-[88px] flex items-center">
          <div className="w-full">
            {profile.bio ? (
              <p className="text-[14px] leading-[1.6] text-brand-body">{profile.bio}</p>
            ) : (
              <p className="text-[13px] text-brand-muted italic">No bio added yet. Edit your profile to introduce yourself.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Skills</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 min-h-[88px] flex items-center">
          <div className="w-full">
            {profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <SkillTag key={skill} label={skill} />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-brand-muted italic">No skills added yet. Edit your profile to list your skills.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Preferred Work Categories</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 min-h-[88px] flex items-center">
          <div className="w-full">
            {profile.preferredCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.preferredCategories.map((cat) => (
                  <CategoryTag key={cat} label={cat} />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-brand-muted italic">No categories selected yet. Edit your profile to set work preferences.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Portfolio Links</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 min-h-[88px] flex items-center">
          <div className="w-full space-y-2">
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
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Social Links</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 min-h-[88px] flex items-center">
          <div className="w-full">
            {socialLinks.length === 0 ? (
              <p className="text-[13px] text-brand-muted italic">No social links added yet. Edit your profile to add them.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-[6px] border border-brand-hairline bg-brand-surface-soft px-3 py-2 text-[13px] font-medium text-brand-body transition-colors active:bg-brand-surface-strong hover:text-brand-primary"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-brand-ink" />
                    <span>{label}</span>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-brand-muted" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
