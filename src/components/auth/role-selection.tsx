"use client";

import * as React from "react";
import { GraduationCap, Briefcase, Check } from "lucide-react";

interface RoleSelectionProps {
  onSelect: (role: "student" | "business") => void;
  onBackToLogin?: () => void;
}

export function RoleSelection({ onSelect, onBackToLogin }: RoleSelectionProps) {
  const [selected, setSelected] = React.useState<"student" | "business" | null>(null);

  const roles = [
    {
      id: "student" as const,
      title: "Student Talent",
      description: "Apply for hyperlocal tasks, showcase verified projects, and get paid instantly upon milestone approval.",
      icon: GraduationCap,
      color: "bg-brand-mint/10 text-brand-forest border-brand-mint/30",
    },
    {
      id: "business" as const,
      title: "Business Owner",
      description: "Deploy on-demand tasks, auto-match with vetted local students, and secure milestones through escrow contracts.",
      icon: Briefcase,
      color: "bg-brand-peach/10 text-brand-coral border-brand-peach/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selected === role.id;

          return (
            <div
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`relative p-5 rounded-[10px] border cursor-pointer transition-all duration-200 text-left flex gap-4 items-start ${
                isSelected
                  ? "border-brand-primary bg-brand-surface-soft shadow-sm"
                  : "border-brand-hairline hover:border-brand-primary/50 hover:bg-brand-surface-soft/50"
              }`}
            >
              <div className={`p-3 rounded-lg shrink-0 border ${role.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1 pr-6">
                <h3 className="font-medium text-base text-brand-ink leading-snug">
                  {role.title}
                </h3>
                <p className="text-xs text-brand-body leading-relaxed">
                  {role.description}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-4 right-4 bg-brand-primary text-white p-0.5 rounded-full shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 space-y-4">
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="w-full h-11 bg-brand-primary text-white rounded-[12px] font-semibold text-sm transition-colors hover:bg-brand-primary-active disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
        >
          Continue
        </button>

        {onBackToLogin && (
          <div className="text-center">
            <button
              onClick={onBackToLogin}
              className="text-xs text-brand-muted hover:text-brand-ink transition-colors font-medium"
            >
              Already have an account? Log In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default RoleSelection;
