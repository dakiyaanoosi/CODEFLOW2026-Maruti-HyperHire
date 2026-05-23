"use client";

import * as React from "react";
import {
  X,
  Clock,
  DollarSign,
  Building2,
  FileText,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";
import { Application, ApplicationStatus } from "@/types/application";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { applicationService } from "@/lib/application-service";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ApplicationDetailModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  isBusiness?: boolean;
  onStatusChange?: (updated: Application) => void;
}

const STATUS_ACTIONS: { status: ApplicationStatus; label: string; className: string }[] = [
  {
    status: "Shortlisted",
    label: "Shortlist",
    className: "bg-[#f4d35e]/20 text-[#a07000] border-[#f4d35e]/50 border",
  },
  {
    status: "Accepted",
    label: "Accept",
    className: "bg-brand-success/10 text-brand-success border-brand-success/20 border",
  },
  {
    status: "Rejected",
    label: "Reject",
    className: "bg-brand-coral/10 text-brand-coral border-brand-coral/20 border",
  },
];

export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  isBusiness = false,
  onStatusChange,
}: ApplicationDetailModalProps) {
  const [isUpdating, setIsUpdating] = React.useState<ApplicationStatus | null>(null);

  const handleStatusChange = async (status: ApplicationStatus) => {
    if (!application) return;
    setIsUpdating(status);
    try {
      const updated = await applicationService.updateStatus(application.applicationId, status);
      onStatusChange?.(updated);
      onClose();
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isOpen || !application) return null;

  const formattedDate = new Date(application.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[12px] border border-brand-hairline shadow-xl"
          >
            <div className="flex items-start justify-between p-6 pb-4 border-b border-brand-hairline sticky top-0 bg-white z-10 rounded-t-[12px]">
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[20px] font-normal leading-[1.5] text-brand-ink truncate">
                    {application.jobTitle}
                  </h2>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                <p className="mt-0.5 text-sm text-brand-muted font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {application.companyName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brand-hairline bg-white text-brand-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    icon: DollarSign,
                    label: "Quoted Price",
                    value: `$${application.quotedPrice.toLocaleString()}`,
                  },
                  {
                    icon: Clock,
                    label: "Delivery",
                    value: `${application.estimatedDeliveryDays} days`,
                  },
                  {
                    icon: Calendar,
                    label: "Applied",
                    value: formattedDate,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline p-3 space-y-1"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted flex items-center gap-1">
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-brand-ink">{item.value}</p>
                  </div>
                ))}
              </div>

              {isBusiness && (
                <div className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline p-4 flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-surface-strong text-brand-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">{application.studentName}</p>
                    <p className="text-xs text-brand-muted">Applicant</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                  <MessageSquare className="h-3.5 w-3.5 text-brand-muted" />
                  Cover Message
                </h3>
                <div className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline p-4 text-sm text-brand-body leading-relaxed">
                  {application.coverMessage}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                  <FileText className="h-3.5 w-3.5 text-brand-muted" />
                  Proposal
                </h3>
                <div className="rounded-[10px] bg-brand-surface-soft border border-brand-hairline p-4 text-sm text-brand-body leading-relaxed whitespace-pre-wrap">
                  {application.proposalText}
                </div>
              </div>

              {isBusiness && application.status === "Pending" && (
                <div className="rounded-[12px] bg-brand-surface-dark p-5 space-y-3">
                  <p className="text-sm font-medium text-white">Review Application</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Choose an action to update the status of this application.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ACTIONS.map((action) => (
                      <button
                        key={action.status}
                        disabled={!!isUpdating}
                        onClick={() => handleStatusChange(action.status)}
                        className={cn(
                          "rounded-[10px] px-4 py-2 text-xs font-semibold bg-white/10 text-white border-white/20 border disabled:opacity-50",
                          action.className
                        )}
                      >
                        {isUpdating === action.status ? "Updating…" : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isBusiness && application.status !== "Pending" && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Change Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ACTIONS.filter((a) => a.status !== application.status).map((action) => (
                      <button
                        key={action.status}
                        disabled={!!isUpdating}
                        onClick={() => handleStatusChange(action.status)}
                        className={cn(
                          "rounded-[10px] px-4 py-2 text-xs font-semibold disabled:opacity-50",
                          action.className
                        )}
                      >
                        {isUpdating === action.status ? "Updating…" : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-brand-hairline bg-white rounded-b-[12px]">
              <button
                onClick={onClose}
                className="rounded-[12px] border border-brand-hairline bg-white px-5 py-2.5 text-sm font-medium text-brand-ink"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
