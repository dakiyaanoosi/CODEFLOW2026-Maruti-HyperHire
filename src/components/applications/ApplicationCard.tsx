"use client";

import * as React from "react";
import { Application } from "@/types/application";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { motion } from "framer-motion";
import {
  Clock,
  DollarSign,
  Building2,
  Calendar,
} from "lucide-react";

interface ApplicationCardProps {
  application: Application;
  onClick: (application: Application) => void;
}

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const formattedDate = new Date(application.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      onClick={() => onClick(application)}
      className="group flex flex-col rounded-[12px] border border-brand-hairline bg-white p-5 shadow-sm cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-[1.35] text-brand-ink group-hover:text-brand-link transition-colors line-clamp-1">
            {application.jobTitle}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-muted font-medium">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>{application.companyName}</span>
          </div>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      <p className="mt-3 text-xs text-brand-body line-clamp-2 leading-relaxed">
        {application.coverLetter}
      </p>

      <div className="mt-auto pt-4 border-t border-brand-hairline/60 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-3 text-brand-muted">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            ${application.proposedBudget.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {application.estimatedDeliveryDays}d
          </span>
        </div>
        <span className="flex items-center gap-1 text-brand-muted font-medium">
          <Calendar className="h-3.5 w-3.5" />
          {formattedDate}
        </span>
      </div>
    </motion.div>
  );
}
