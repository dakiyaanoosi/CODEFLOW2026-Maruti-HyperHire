"use client";

import * as React from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { KanbanTask, KANBAN_STAGES, STAGE_CONFIG } from "@/types/kanban";
import { cn } from "@/lib/utils";

interface KanbanStatsBarProps {
  tasks: KanbanTask[];
}

export function KanbanStatsBar({ tasks }: KanbanStatsBarProps) {
  const totalValue = tasks.reduce((s, t) => s + t.quotedPrice, 0);
  const completed = tasks.filter((t) => t.stage === "Completed" || t.stage === "Paid").length;
  const inFlight = tasks.filter((t) => t.stage === "In Progress" || t.stage === "Revision").length;
  const overdue = tasks.filter(
    (t) =>
      t.stage !== "Completed" &&
      t.stage !== "Paid" &&
      new Date(t.dueDate) < new Date()
  ).length;

  const avgProgress =
    tasks.length > 0
      ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
      : 0;

  // Pipeline distribution
  const stageDistribution = KANBAN_STAGES.map((stage) => ({
    stage,
    count: tasks.filter((t) => t.stage === stage).length,
    cfg: STAGE_CONFIG[stage],
  }));

  const stats = [
    {
      label: "Total Pipeline Value",
      value: `$${totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-brand-ink",
    },
    {
      label: "Avg. Progress",
      value: `${avgProgress}%`,
      icon: TrendingUp,
      color: "text-[#254fad]",
    },
    {
      label: "Active Tasks",
      value: inFlight,
      icon: Clock,
      color: "text-[#d9a441]",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-[#006400]",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-[12px] border border-brand-hairline bg-white px-4 py-3.5 shadow-sm"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                {s.label}
              </p>
              <p className={cn("text-xl font-bold mt-0.5 leading-none", s.color)}>
                {s.value}
              </p>
            </div>
            <div className="rounded-full bg-brand-surface-soft p-2.5">
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline distribution bar */}
      <div className="rounded-[12px] border border-brand-hairline bg-white px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Pipeline Distribution
          </p>
          <p className="text-xs font-semibold text-brand-muted">
            {tasks.length} total tasks
          </p>
        </div>

        {/* Stacked bar */}
        {tasks.length > 0 ? (
          <>
            <div className="flex h-2 w-full rounded-full overflow-hidden gap-0.5">
              {stageDistribution
                .filter((s) => s.count > 0)
                .map((s) => (
                  <div
                    key={s.stage}
                    style={{
                      width: `${(s.count / tasks.length) * 100}%`,
                      background: s.cfg.accentBar,
                    }}
                    className="first:rounded-l-full last:rounded-r-full transition-all duration-500"
                    title={`${s.stage}: ${s.count}`}
                  />
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              {stageDistribution.map((s) => (
                <div key={s.stage} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: s.cfg.accentBar }}
                  />
                  <span className="text-[11px] font-medium text-brand-muted">
                    {s.stage}{" "}
                    <span className="font-bold text-brand-ink">{s.count}</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-brand-muted font-medium">No tasks in pipeline yet.</p>
        )}
      </div>
    </div>
  );
}
