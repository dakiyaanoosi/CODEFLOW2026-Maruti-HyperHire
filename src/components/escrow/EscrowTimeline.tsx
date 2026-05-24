"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Send, Banknote, AlertTriangle } from "lucide-react";
import type { EscrowEvent } from "@/types/escrow";
const EVENT_CONFIG: Record<
  string,
  { label: string; Icon: React.ElementType; color: string; ring: string }
> = {
  funded:             { label: "Escrow Funded",       Icon: Banknote,       color: "text-brand-mustard",  ring: "bg-brand-yellow/20 border-brand-mustard/30" },
  completed:          { label: "Work Completed",      Icon: CheckCircle2,   color: "text-brand-success",  ring: "bg-brand-mint/20 border-brand-success/30" },
  released:           { label: "Funds Released",      Icon: Banknote,       color: "text-emerald-600",    ring: "bg-emerald-500/10 border-emerald-500/20" },
  revision_requested: { label: "Revision Requested",  Icon: AlertTriangle,  color: "text-brand-coral",    ring: "bg-brand-coral/10 border-brand-coral/25" },
  submitted:          { label: "Work Submitted",      Icon: Send,           color: "text-brand-info",     ring: "bg-[#254fad]/10 border-[#458fff]/30" },
  approved:           { label: "Work Approved",       Icon: CheckCircle2,   color: "text-brand-success",  ring: "bg-brand-mint/20 border-brand-success/30" },
  disputed:           { label: "Dispute Raised",      Icon: AlertTriangle,  color: "text-brand-coral",    ring: "bg-brand-coral/10 border-brand-coral/30" },
};
function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
interface EscrowTimelineProps {
  events: EscrowEvent[];
}
export function EscrowTimeline({ events }: EscrowTimelineProps) {
  return (
    <ol className="relative pl-6">
      {}
      <span className="absolute left-[11px] top-3 bottom-3 w-px bg-brand-hairline" />
      {events.map((ev, i) => {
        const cfg = EVENT_CONFIG[ev.type];
        const Icon = cfg.Icon;
        const isLast = i === events.length - 1;
        return (
          <li key={i} className={cn("relative flex gap-3", !isLast && "pb-5")}>
            {}
            <div
              className={cn(
                "absolute -left-6 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                cfg.ring
              )}
            >
              <Icon className={cn("h-3 w-3", cfg.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-ink leading-[1.4]">{cfg.label}</p>
              {ev.note && (
                <p className="mt-0.5 text-xs text-brand-body leading-[1.25]">{ev.note}</p>
              )}
              <p className="mt-0.5 text-[11px] text-brand-muted leading-[1.35]">{fmt(ev.timestamp)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
