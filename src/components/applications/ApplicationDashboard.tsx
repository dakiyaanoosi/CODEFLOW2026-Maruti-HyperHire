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
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
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

const ALL_STATUSES: ApplicationStatus[] = ["submitted", "shortlisted", "accepted", "rejected", "completed"];

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
      pending: applications.filter((a) => a.status === "submitted").length,
      shortlisted: applications.filter((a) => a.status === "shortlisted").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
      completed: applications.filter((a) => a.status === "completed").length,
    };
  }, [applications]);

  const filteredApplications = React.useMemo(() => {
    return applications.filter((a) => {
      const matchesSearch =
        search.trim() === "" ||
        a.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        a.companyName.toLowerCase().includes(search.toLowerCase()) ||
        a.coverLetter.toLowerCase().includes(search.toLowerCase()) ||
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
      label: "submitted",
      value: stats.pending,
      icon: Clock,
      color: "text-brand-muted",
    },
    {
      label: "shortlisted",
      value: stats.shortlisted,
      icon: Star,
      color: "text-[#a07000]",
    },
    {
      label: "accepted",
      value: stats.accepted,
      icon: CheckCircle2,
      color: "text-brand-success",
    },
    {
      label: "rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "text-brand-coral",
    },
    {
      label: "completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-brand-info",
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-surface-soft text-brand-muted border border-brand-hairline/40 shadow-inner">
            <FolderOpen className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-base font-semibold text-brand-ink">
            {applications.length === 0
              ? isBusiness
                ? "No applications received yet"
                : "No applications submitted yet"
              : "No matching applications found"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-brand-muted leading-relaxed font-medium">
            {applications.length === 0
              ? isBusiness
                ? "Once students apply to your jobs, you'll see their AI-enhanced pitches, proposed budgets, and match scores here."
                : "Your job application journey starts here. Our AI will help match you with the best opportunities."
              : "Try adjusting your search terms or status filter."}
          </p>
          {applications.length === 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={isBusiness ? "/jobs/create" : "/marketplace"}
                className="flex items-center gap-2 rounded-[10px] bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 transition-colors"
              >
                {isBusiness ? "Post a New Job" : "Browse Marketplace"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="flex items-center gap-2 rounded-[10px] border border-brand-hairline bg-white px-5 py-2.5 text-sm font-semibold text-brand-ink shadow-sm hover:bg-brand-surface-soft transition-colors">
                <Sparkles className="h-4 w-4 text-brand-secondary" />
                {isBusiness ? "AI Market Insights" : "Get AI Recommendations"}
              </button>
            </div>
          )}
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
