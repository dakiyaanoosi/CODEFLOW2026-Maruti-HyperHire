"use client";

import * as React from "react";

interface SemanticBadgeProps {
  /** Score from 0–100 */
  score: number;
  label?: string;
  size?: "sm" | "md";
}

function getScoreColor(score: number): {
  ring: string;
  text: string;
  bg: string;
} {
  if (score >= 75) {
    return {
      ring: "stroke-brand-mint",
      text: "text-brand-success",
      bg: "bg-white",
    };
  }
  if (score >= 50) {
    return {
      ring: "stroke-brand-yellow",
      text: "text-brand-mustard",
      bg: "bg-white",
    };
  }
  return {
    ring: "stroke-brand-peach",
    text: "text-brand-coral",
      bg: "bg-white",
  };
}

export function SemanticBadge({ score, label, size = "md" }: SemanticBadgeProps) {
  const { ring, text, bg } = getScoreColor(score);
  const isSmall = size === "sm";

  // SVG ring config
  const r = isSmall ? 14 : 18;
  const cx = isSmall ? 16 : 22;
  const cy = cx;
  const circumference = 2 * Math.PI * r;
  const progress = circumference - (score / 100) * circumference;
  const svgSize = cx * 2;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-[8px] border border-brand-hairline px-2 py-1 ${bg}`}
      title={`${label || "Semantic Score"}: ${score}%`}
    >
      {/* Ring progress */}
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={isSmall ? 2.5 : 3}
          className="text-brand-hairline"
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth={isSmall ? 2.5 : 3}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          className={ring}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>

      {/* Score + label */}
      <div className="flex flex-col">
        <span className={`text-[11px] font-medium leading-none ${text}`}>
          {score}%
        </span>
        {label && (
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider leading-none text-brand-muted">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
