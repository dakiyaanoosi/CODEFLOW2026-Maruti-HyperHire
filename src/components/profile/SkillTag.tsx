"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillTagProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

export function SkillTag({ label, onRemove, className }: SkillTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] border border-brand-hairline bg-brand-surface-soft px-2.5 py-1 text-[13px] font-medium leading-[1.35] text-brand-body",
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-sm text-brand-muted transition-colors active:text-brand-ink"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

interface CategoryTagProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

export function CategoryTag({ label, onRemove, className }: CategoryTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] border border-brand-peach/40 bg-brand-peach/10 px-2.5 py-1 text-[13px] font-medium leading-[1.35] text-brand-coral",
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-sm text-brand-coral/60 active:text-brand-coral"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}