"use client";

import * as React from "react";
import { useHyperAIStore } from "@/store/use-hyperai-store";
import {
  LayoutDashboard,
  Store,
  User,
  FolderOpen,
  Briefcase,
  FileText,
  Settings,
  MessageSquare,
  BarChart2,
} from "lucide-react";

// Page icon mapping
const PAGE_ICONS: Record<string, React.ElementType> = {
  "/dashboard": LayoutDashboard,
  "/marketplace": Store,
  "/profile": User,
  "/portfolio": FolderOpen,
  "/jobs": Briefcase,
  "/applications": FileText,
  "/settings": Settings,
  "/messages": MessageSquare,
  "/analytics": BarChart2,
  "/talent": User,
  "/business-profile": Briefcase,
};

function getPageIcon(path: string | null): React.ElementType {
  if (!path) return LayoutDashboard;
  for (const [key, Icon] of Object.entries(PAGE_ICONS)) {
    if (path.includes(key)) return Icon;
  }
  return LayoutDashboard;
}

function getPageLabel(path: string | null): string {
  if (!path) return "Dashboard";
  const mapping: Record<string, string> = {
    "/marketplace": "Marketplace",
    "/profile": "Profile",
    "/portfolio": "Portfolio",
    "/jobs": "Jobs",
    "/applications": "Applications",
    "/talent": "Talent Search",
    "/analytics": "Analytics",
    "/messages": "Messages",
    "/settings": "Settings",
    "/business-profile": "Business Profile",
    "/dashboard": "Dashboard",
  };
  for (const [key, label] of Object.entries(mapping)) {
    if (path.includes(key)) return label;
  }
  return "Dashboard";
}

interface ContextChipProps {
  label: string;
  value: string;
  color?: "mint" | "peach" | "yellow" | "default";
}

function ContextChip({ label, value, color = "default" }: ContextChipProps) {
  const colorMap = {
    mint: "bg-white text-brand-success border-brand-hairline",
    peach: "bg-white text-brand-coral border-brand-hairline",
    yellow: "bg-white text-brand-mustard border-brand-hairline",
    default: "bg-white text-brand-muted border-brand-hairline",
  };

  return (
    <div className={`flex items-center gap-1.5 rounded-[6px] border px-2 py-1 ${colorMap[color]}`}>
      <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
      <span className="max-w-[80px] truncate text-[10px] font-medium">{value}</span>
    </div>
  );
}

export function ContextStatusBar() {
  const { pageContext, userRole, activeJob, activeProfile, activePortfolio } = useHyperAIStore();

  const PageIcon = getPageIcon(pageContext);
  const pageLabel = getPageLabel(pageContext);
  const hasActiveContext = !!(activeJob || activeProfile || activePortfolio?.length);

  return (
    <div className="shrink-0 border-b border-brand-hairline bg-brand-surface-soft px-4 py-2.5">
      {/* Page context row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <PageIcon className="h-3.5 w-3.5 text-brand-muted shrink-0" />
          <span className="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
            {pageLabel}
          </span>
        </div>

        {/* AI engine status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${hasActiveContext ? "bg-brand-success" : "bg-brand-surface-strong"}`}
          />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-muted">
            {hasActiveContext ? "Context Loaded" : "Awaiting Context"}
          </span>
        </div>
      </div>

      {/* Active entity chips */}
      {hasActiveContext && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activeJob && (
            <ContextChip
              label="Job"
              value={activeJob.title || "Active Job"}
              color="peach"
            />
          )}
          {activeProfile?.name && (
            <ContextChip
              label="Profile"
              value={activeProfile.name}
              color="mint"
            />
          )}
          {activePortfolio && activePortfolio.length > 0 && (
            <ContextChip
              label="Portfolio"
              value={`${activePortfolio.length} items`}
              color="yellow"
            />
          )}
        </div>
      )}
    </div>
  );
}
