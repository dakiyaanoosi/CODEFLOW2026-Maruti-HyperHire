"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillTag, CategoryTag } from "./SkillTag";
import { StudentProfile, EXPERIENCE_LEVELS, ALL_CATEGORIES, ExperienceLevel, WorkCategory } from "@/types/profile";

interface ProfileEditFormProps {
  profile: StudentProfile;
  onChange: (partial: Partial<StudentProfile>) => void;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-brand-body">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-[6px] border border-brand-hairline bg-white px-4 text-[14px] text-brand-ink placeholder:text-brand-border-strong outline-none focus:border-brand-info-border focus:ring-2 focus:ring-brand-info/20 transition-all"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-brand-body">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-[6px] border border-brand-hairline bg-white px-4 py-3 text-[14px] text-brand-ink placeholder:text-brand-border-strong outline-none focus:border-brand-info-border focus:ring-2 focus:ring-brand-info/20 transition-all resize-none"
      />
    </div>
  );
}

export function ProfileEditForm({ profile, onChange }: ProfileEditFormProps) {
  const [newSkill, setNewSkill] = React.useState("");
  const [newPortfolio, setNewPortfolio] = React.useState("");

  function addSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed || profile.skills.includes(trimmed)) return;
    onChange({ skills: [...profile.skills, trimmed] });
    setNewSkill("");
  }

  function removeSkill(skill: string) {
    onChange({ skills: profile.skills.filter((s) => s !== skill) });
  }

  function toggleCategory(cat: WorkCategory) {
    const has = profile.preferredCategories.includes(cat);
    onChange({
      preferredCategories: has
        ? profile.preferredCategories.filter((c) => c !== cat)
        : [...profile.preferredCategories, cat],
    });
  }

  function addPortfolioLink() {
    const trimmed = newPortfolio.trim();
    if (!trimmed || profile.portfolioLinks.includes(trimmed)) return;
    onChange({ portfolioLinks: [...profile.portfolioLinks, trimmed] });
    setNewPortfolio("");
  }

  function removePortfolioLink(link: string) {
    onChange({ portfolioLinks: profile.portfolioLinks.filter((l) => l !== link) });
  }

  return (
    <div className="space-y-4">
      
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <InputField
            label="Full Name"
            value={profile.name}
            onChange={(v) => onChange({ name: v, avatarInitials: v.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() })}
            placeholder="Your full name"
          />
          <InputField
            label="College / University"
            value={profile.college}
            onChange={(v) => onChange({ college: v })}
            placeholder="e.g. IIT Bombay"
          />
          <TextAreaField
            label="Bio"
            value={profile.bio}
            onChange={(v) => onChange({ bio: v })}
            placeholder="Tell employers about yourself..."
            rows={3}
          />
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Work Preferences</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-brand-body">Experience Level</label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange({ experienceLevel: level as ExperienceLevel })}
                  className={`rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    profile.experienceLevel === level
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-brand-hairline bg-white text-brand-body active:bg-brand-surface-soft"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <InputField
            label="Availability"
            value={profile.availability}
            onChange={(v) => onChange({ availability: v })}
            placeholder="e.g. 20 hrs/week"
          />

          <InputField
            label="Hourly Rate (USD)"
            value={profile.hourlyRate}
            onChange={(v) => onChange({ hourlyRate: parseFloat(v) || 0 })}
            type="number"
            placeholder="e.g. 18"
          />
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Skills</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <SkillTag key={skill} label={skill} onRemove={() => removeSkill(skill)} />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add a skill..."
              className="h-9 flex-1 rounded-[6px] border border-brand-hairline bg-white px-3 text-[13px] text-brand-ink placeholder:text-brand-border-strong outline-none focus:border-brand-info-border focus:ring-2 focus:ring-brand-info/20 transition-all"
            />
            <Button variant="outline" size="sm" onClick={addSkill}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

    
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Preferred Work Categories</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const selected = profile.preferredCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 text-[13px] font-medium transition-colors ${
                    selected
                      ? "border-brand-peach/40 bg-brand-peach/10 text-brand-coral"
                      : "border-brand-hairline bg-white text-brand-muted active:bg-brand-surface-soft"
                  }`}
                >
                  {selected && <X className="h-3 w-3 shrink-0" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Portfolio Links</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-2">
            {profile.portfolioLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 truncate rounded-[6px] border border-brand-hairline bg-brand-surface-soft px-3 py-2 text-[13px] text-brand-body">
                  {link}
                </span>
                <button
                  type="button"
                  onClick={() => removePortfolioLink(link)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-brand-hairline bg-white text-brand-muted active:bg-brand-surface-soft"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={newPortfolio}
              onChange={(e) => setNewPortfolio(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPortfolioLink()}
              placeholder="https://your-project.com"
              className="h-9 flex-1 rounded-[6px] border border-brand-hairline bg-white px-3 text-[13px] text-brand-ink placeholder:text-brand-border-strong outline-none focus:border-brand-info-border focus:ring-2 focus:ring-brand-info/20 transition-all"
            />
            <Button variant="outline" size="sm" onClick={addPortfolioLink}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

 
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Social Links</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <InputField
            label="GitHub"
            value={profile.socialLinks.github ?? ""}
            onChange={(v) => onChange({ socialLinks: { ...profile.socialLinks, github: v } })}
            placeholder="https://github.com/username"
          />
          <InputField
            label="LinkedIn"
            value={profile.socialLinks.linkedin ?? ""}
            onChange={(v) => onChange({ socialLinks: { ...profile.socialLinks, linkedin: v } })}
            placeholder="https://linkedin.com/in/username"
          />
          <InputField
            label="Twitter / X"
            value={profile.socialLinks.twitter ?? ""}
            onChange={(v) => onChange({ socialLinks: { ...profile.socialLinks, twitter: v } })}
            placeholder="https://twitter.com/username"
          />
          <InputField
            label="Personal Website"
            value={profile.socialLinks.website ?? ""}
            onChange={(v) => onChange({ socialLinks: { ...profile.socialLinks, website: v } })}
            placeholder="https://yourwebsite.com"
          />
        </CardContent>
      </Card>
    </div>
  );
}
