"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProjectCostEntry } from "@/types/earnings";

interface ProjectCostsTableProps {
  projects: ProjectCostEntry[];
}

export function ProjectCostsTable({ projects }: ProjectCostsTableProps) {
  return (
    <div className="rounded-[10px] border border-brand-hairline bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-hairline">
        <p className="text-xs font-medium uppercase tracking-[0.16px] text-brand-muted">
          Project Costs
        </p>
      </div>
      <div className="divide-y divide-brand-hairline">
        {projects.map((p, i) => {
          const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
          const isOver = pct > 100;
          return (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-ink truncate">{p.jobTitle}</p>
                  <p className="text-xs text-brand-muted mt-0.5">{p.studentName} · {p.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-brand-ink">
                    ₹{p.spent.toLocaleString()}
                    <span className="text-brand-muted font-normal"> / ₹{p.budget.toLocaleString()}</span>
                  </p>
                  <p className={cn("text-xs mt-0.5", p.completedAt ? "text-brand-success" : "text-brand-muted")}>
                    {p.completedAt
                      ? `Done ${new Date(p.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                      : "In progress"}
                  </p>
                </div>
              </div>
              {/* Budget bar */}
              <div className="h-1.5 w-full rounded-full bg-brand-surface-strong overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", isOver ? "bg-brand-coral" : "bg-brand-ink")}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
