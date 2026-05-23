"use client";

import * as React from "react";
import {
  Search,
  FolderOpen,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
} from "lucide-react";
import { Application, ApplicationStatus } from "@/types/application";
import { ApplicationCard } from "./ApplicationCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ApplicationDashboardProps {
  applications: Application[];
  isLoading: boolean;
  onCardClick: (application: Application) => void;
  isBusiness?: boolean;
}

const ALL_STATUSES: ApplicationStatus[] = ["Pending", "Shortlisted", "Accepted", "Rejected"];

export function ApplicationDashboard({
  applications,
  isLoading,
  onCardClick,
  isBusiness = false,
}: ApplicationDashboardProps) {
  const [search, setSearch] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("All");

  const stats = React.useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === "Pending").length,
      shortlisted: applications.filter((a) => a.status === "Shortlisted").length,
      accepted: applications.filter((a) => a.status === "Accepted").length,
      rejected: applications.filter((a) => a.status === "Rejected").length,
    };
  }, [applications]);

  const filteredApplications = React.useMemo(() => {
    return applications.filter((a) => {
      const matchesSearch =
        search.trim() === "" ||
        a.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        a.companyName.toLowerCase().includes(search.toLowerCase()) ||
        a.coverMessage.toLowerCase().includes(search.toLowerCase()) ||
        a.studentName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = selectedStatus === "All" || a.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, selectedStatus]);

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: Send,
      color: "text-brand-ink",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-brand-muted",
    },
    {
      label: "Shortlisted",
      value: stats.shortlisted,
      icon: Star,
      color: "text-[#a07000]",
    },
    {
      label: "Accepted",
      value: stats.accepted,
      icon: CheckCircle2,
      color: "text-brand-success",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "text-brand-coral",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-[12px] border border-brand-hairline bg-white p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 animate-pulse rounded bg-brand-surface-strong/60" />
              <div className="h-5 w-16 animate-pulse rounded-[6px] bg-brand-surface-strong/60" />
            </div>
            <div className="h-3.5 w-28 animate-pulse rounded bg-brand-surface-strong/50" />
            <div className="space-y-1.5">
              <div className="h-3 w-full animate-pulse rounded bg-brand-surface-strong/40" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-brand-surface-strong/40" />
            </div>
            <div className="pt-4 border-t border-brand-hairline/60 flex justify-between">
              <div className="h-3.5 w-16 animate-pulse rounded bg-brand-surface-strong/50" />
              <div className="h-3.5 w-20 animate-pulse rounded bg-brand-surface-strong/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-[12px] border border-brand-hairline bg-white p-4 shadow-sm"
          >
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">{item.label}</p>
              <p className="text-xl font-bold text-brand-ink leading-none">{item.value}</p>
            </div>
            <div className="rounded-full bg-brand-surface-soft p-2.5">
              <item.icon className={cn("h-4 w-4", item.color)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder={
              isBusiness
                ? "Search by job title, applicant, message…"
                : "Search by job title, company…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-white rounded-[10px] border border-brand-hairline outline-none focus:border-brand-info-border shadow-sm placeholder:text-brand-muted"
          />
        </div>

        <div className="flex items-center gap-1 rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-1 h-11 shrink-0">
          {["All", ...ALL_STATUSES].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={cn(
                "rounded-[8px] px-3 h-full text-xs font-semibold transition-colors",
                selectedStatus === status
                  ? "bg-white text-brand-ink shadow-sm"
                  : "text-brand-muted"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredApplications.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredApplications.map((app) => (
              <ApplicationCard
                key={app.applicationId}
                application={app}
                onClick={onCardClick}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-[12px] border border-brand-hairline bg-white py-20 px-4 text-center shadow-sm"
        >
          <div className="grid h-14 w-14 place-items-center rounded-[12px] bg-brand-surface-soft text-brand-muted border border-brand-hairline/40">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-brand-ink">
            {applications.length === 0
              ? isBusiness
                ? "No applications received yet"
                : "No applications submitted yet"
              : "No matching applications found"}
          </h3>
          <p className="mt-1.5 max-w-xs text-xs text-brand-muted leading-relaxed font-medium">
            {applications.length === 0
              ? isBusiness
                ? "Applications from students will appear here once they apply to your gig listings."
                : "Browse the marketplace and apply to gigs to see your applications here."
              : "Try adjusting your search terms or status filter."}
          </p>
          {applications.length > 0 && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedStatus("All");
              }}
              className="mt-5 rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-xs font-semibold text-brand-ink"
            >
              Reset Filters
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
