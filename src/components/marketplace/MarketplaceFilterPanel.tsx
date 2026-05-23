"use client";

import * as React from "react";
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { MarketplaceFilters, DEADLINE_FILTERS } from "@/types/marketplace";
import { ALL_CATEGORIES } from "@/types/profile";
import { cn } from "@/lib/utils";

const WORK_MODES = ["Remote", "On-site", "Hybrid"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

interface FiltersSection {
  title: string;
  key: string;
}

interface MarketplaceFilterPanelProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
  totalCount: number;
  filteredCount: number;
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-brand-hairline last:border-0 pb-4 last:pb-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-brand-ink transition-colors"
      >
        {title}
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      {open && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        className={cn(
          "h-4 w-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all",
          checked
            ? "bg-brand-ink border-brand-ink"
            : "border-brand-hairline group-hover:border-brand-border-strong"
        )}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg
            className="h-2.5 w-2.5 text-white"
            fill="none"
            viewBox="0 0 10 10"
          >
            <path
              d="M1.5 5L4 7.5L8.5 2.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span
        className={cn(
          "text-xs font-medium transition-colors",
          checked ? "text-brand-ink" : "text-brand-body"
        )}
      >
        {label}
      </span>
    </label>
  );
}

export function MarketplaceFilterPanel({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: MarketplaceFilterPanelProps) {
  const toggleArrayFilter = (
    key: "categories" | "workModes" | "difficulties",
    value: string
  ) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.workModes.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.deadlineFilter !== "all" ||
    filters.budgetMin !== null ||
    filters.budgetMax !== null ||
    filters.skills.length > 0;

  const clearAll = () => {
    onFiltersChange({
      ...filters,
      categories: [],
      workModes: [],
      difficulties: [],
      deadlineFilter: "all",
      budgetMin: null,
      budgetMax: null,
      skills: [],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand-muted" />
          <span className="text-sm font-semibold text-brand-ink">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-[11px] font-semibold text-brand-link hover:text-brand-link-active transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="rounded-[8px] bg-brand-surface-soft border border-brand-hairline px-3 py-2 text-xs text-brand-muted font-medium">
        Showing{" "}
        <span className="font-bold text-brand-ink">{filteredCount}</span> of{" "}
        <span className="font-semibold">{totalCount}</span> listings
      </div>

      {/* Filter Sections */}
      <div className="space-y-4">
        {/* Deadline */}
        <CollapsibleSection title="Deadline">
          {DEADLINE_FILTERS.map((opt) => (
            <CheckboxOption
              key={opt.value}
              label={opt.label}
              checked={filters.deadlineFilter === opt.value}
              onChange={() =>
                onFiltersChange({ ...filters, deadlineFilter: opt.value })
              }
            />
          ))}
        </CollapsibleSection>

        {/* Category */}
        <CollapsibleSection title="Category">
          {ALL_CATEGORIES.slice(0, 8).map((cat) => (
            <CheckboxOption
              key={cat}
              label={cat}
              checked={filters.categories.includes(cat)}
              onChange={() => toggleArrayFilter("categories", cat)}
            />
          ))}
        </CollapsibleSection>

        {/* Work Mode */}
        <CollapsibleSection title="Work Mode">
          {WORK_MODES.map((mode) => (
            <CheckboxOption
              key={mode}
              label={mode}
              checked={filters.workModes.includes(mode)}
              onChange={() => toggleArrayFilter("workModes", mode)}
            />
          ))}
        </CollapsibleSection>

        {/* Difficulty */}
        <CollapsibleSection title="Difficulty">
          {DIFFICULTIES.map((d) => (
            <CheckboxOption
              key={d}
              label={d}
              checked={filters.difficulties.includes(d)}
              onChange={() => toggleArrayFilter("difficulties", d)}
            />
          ))}
        </CollapsibleSection>

        {/* Budget Range */}
        <CollapsibleSection title="Budget Range" defaultOpen={false}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-medium text-brand-muted mb-1 block">
                Min ($)
              </label>
              <input
                type="number"
                value={filters.budgetMin ?? ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    budgetMin: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="0"
                className="w-full h-8 px-2.5 text-xs rounded-[6px] border border-brand-hairline bg-white outline-none focus:border-brand-info-border text-brand-ink"
              />
            </div>
            <span className="text-brand-muted text-xs mt-4">–</span>
            <div className="flex-1">
              <label className="text-[10px] font-medium text-brand-muted mb-1 block">
                Max ($)
              </label>
              <input
                type="number"
                value={filters.budgetMax ?? ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    budgetMax: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="5000"
                className="w-full h-8 px-2.5 text-xs rounded-[6px] border border-brand-hairline bg-white outline-none focus:border-brand-info-border text-brand-ink"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
