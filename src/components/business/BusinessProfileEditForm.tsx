"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BusinessProfile,
  ALL_INDUSTRIES,
  ALL_TEAM_SIZES,
  ALL_BUDGET_RANGES,
  Industry,
  TeamSize,
  BudgetRange,
} from "@/types/business";

interface BusinessProfileEditFormProps {
  profile: BusinessProfile;
  onChange: (partial: Partial<BusinessProfile>) => void;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-brand-body">{label}</label>
      <input
        type="text"
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
  rows = 3,
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

function OptionSelector<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-brand-body">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={`rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              selected === opt
                ? "border-brand-primary bg-brand-primary text-white"
                : "border-brand-hairline bg-white text-brand-body"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BusinessProfileEditForm({
  profile,
  onChange,
}: BusinessProfileEditFormProps) {
  const prefLabels: { key: keyof typeof profile.hiringPreferences; label: string }[] = [
    { key: "remote", label: "Remote" },
    { key: "partTime", label: "Part-time" },
    { key: "fullTime", label: "Full-time" },
    { key: "internship", label: "Internship" },
  ];

  function togglePref(key: keyof typeof profile.hiringPreferences) {
    onChange({
      hiringPreferences: {
        ...profile.hiringPreferences,
        [key]: !profile.hiringPreferences[key],
      },
    });
  }

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">


          <InputField
            label="Company Name"
            value={profile.companyName}
            onChange={(v) =>
              onChange({
                companyName: v,
                logoInitials: v
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase(),
              })
            }
            placeholder="Your company name"
          />

          <InputField
            label="Website URL"
            value={profile.website || ""}
            onChange={(v) => onChange({ website: v })}
            placeholder="e.g. https://nexastack.dev"
          />

          <TextAreaField
            label="Description"
            value={profile.description}
            onChange={(v) => onChange({ description: v })}
            placeholder="What does your company do?"
          />
          <InputField
            label="Location"
            value={profile.location}
            onChange={(v) => onChange({ location: v })}
            placeholder="e.g. Bangalore, India"
          />
        </CardContent>
      </Card>

      {/* Industry */}
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Industry & Size</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <OptionSelector
            label="Industry"
            options={ALL_INDUSTRIES}
            selected={profile.industry}
            onSelect={(v) => onChange({ industry: v as Industry })}
          />
          <OptionSelector
            label="Team Size"
            options={ALL_TEAM_SIZES}
            selected={profile.companySize}
            onSelect={(v) => onChange({ companySize: v as TeamSize, teamSize: v as TeamSize })}
          />
          <OptionSelector
            label="Budget Range"
            options={ALL_BUDGET_RANGES}
            selected={profile.budgetRange}
            onSelect={(v) => onChange({ budgetRange: v as BudgetRange })}
          />
        </CardContent>
      </Card>

      {/* Hiring Preferences */}
      <Card className="bg-white">
        <CardHeader className="border-b border-brand-hairline pb-3">
          <CardTitle className="text-[16px]">Hiring Preferences</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {prefLabels.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => togglePref(key)}
                className={`rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  profile.hiringPreferences[key]
                    ? "border-brand-success/30 bg-brand-success/10 text-brand-success"
                    : "border-brand-hairline bg-white text-brand-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
