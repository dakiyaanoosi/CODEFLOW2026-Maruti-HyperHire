"use client";

import * as React from "react";
import { Briefcase, Calendar, MapPin, IndianRupee, BarChart2 } from "lucide-react";
import { Job } from "@/types/job";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const formattedDate = new Date(job.deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Color mappings for difficulty badge
  const difficultyColors = {
    Beginner: "bg-[#0a2e0e]/10 text-[#006400] border-[#0a2e0e]/20",
    Intermediate: "bg-brand-info/10 text-brand-info border-brand-info/20",
    Advanced: "bg-brand-coral/10 text-brand-coral border-brand-coral/20",
  };

  const statusColors = {
    Draft: "bg-brand-surface-strong text-brand-muted border-brand-hairline",
    Published: "bg-brand-success/15 text-brand-success border-brand-success/20",
    Completed: "bg-brand-info/10 text-brand-info border-brand-info/20",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      onClick={onClick}
      className="group flex flex-col rounded-[12px] border border-brand-hairline bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      {/* Top Meta info */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {job.category}
        </span>
        
        <div className="flex items-center gap-2">
          {/* Status pill */}
          <span className={cn(
            "rounded-[6px] border px-2 py-0.5 text-[10px] font-bold uppercase font-mono",
            statusColors[job.status]
          )}>
            {job.status}
          </span>
          
          {/* Difficulty pill */}
          <span className={cn(
            "rounded-[6px] border px-2 py-0.5 text-[10px] font-bold uppercase font-mono flex items-center gap-1",
            difficultyColors[job.difficultyLevel]
          )}>
            <BarChart2 className="h-2.5 w-2.5" />
            {job.difficultyLevel}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-3.5 text-base font-semibold leading-[1.35] text-brand-ink group-hover:text-brand-link transition-colors line-clamp-1">
        {job.title}
      </h3>
      
      {/* Company / Work Mode */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-brand-muted">
        <span className="font-medium text-brand-body truncate max-w-[120px]">{job.companyName}</span>
        <span className="h-1 w-1 rounded-full bg-brand-hairline" />
        <span className="flex items-center gap-1 font-medium">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {job.workMode}
        </span>
      </div>

      <p className="mt-3 text-xs text-brand-body line-clamp-2 leading-relaxed">
        {job.description}
      </p>

      {/* Skills tags */}
      {job.requiredSkills && job.requiredSkills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {job.requiredSkills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="rounded-[6px] bg-brand-surface-soft px-2 py-0.5 text-[10px] font-medium text-brand-muted border border-brand-hairline/60"
            >
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 3 && (
            <span className="rounded-[6px] bg-brand-surface-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-muted">
              +{job.requiredSkills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer statistics (Budget & Deadline) */}
      <div className="mt-auto pt-4 border-t border-brand-hairline/60 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center text-brand-ink">
          <IndianRupee className="h-4 w-4 text-brand-muted shrink-0 -ml-0.5" />
          <span className="text-sm font-bold text-brand-ink">₹{job.budget}</span>
        </div>
        
        <div className="flex items-center gap-1 text-brand-muted font-medium">
          <Calendar className="h-3.5 w-3.5" />
          <span>Due {formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
