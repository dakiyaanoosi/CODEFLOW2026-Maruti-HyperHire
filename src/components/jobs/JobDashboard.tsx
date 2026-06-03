"use client";

import * as React from "react";
import { Search, FolderOpen, Plus, Briefcase, FileText, CheckCircle2 } from "lucide-react";
import { Job } from "@/types/job";
import { ALL_CATEGORIES } from "@/types/profile";
import { JobCard } from "./JobCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface JobDashboardProps {
  jobs: Job[];
  isLoading: boolean;
  onCardClick: (job: Job) => void;
  onAddClick: () => void;
  canManage?: boolean;
}

export function JobDashboard({
  jobs,
  isLoading,
  onCardClick,
  onAddClick,
  canManage = true,
}: JobDashboardProps) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("All");

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedStatus("All");
  };

  // Filtered jobs list
  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        search.trim() === "" ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase()) ||
        job.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" || job.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "All" || job.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [jobs, search, selectedCategory, selectedStatus]);

  // Statistics counters
  const stats = React.useMemo(() => {
    const total = jobs.length;
    const published = jobs.filter((j) => j.status === "Published").length;
    const drafts = jobs.filter((j) => j.status === "Draft").length;
    const completed = jobs.filter((j) => j.status === "Completed").length;
    return { total, published, drafts, completed };
  }, [jobs]);

  // Loading skeleton layout
  const renderSkeletons = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col overflow-hidden rounded-[12px] border border-brand-hairline bg-white p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 animate-pulse rounded bg-brand-surface-strong/60" />
              <div className="h-5 w-14 animate-pulse rounded-[6px] bg-brand-surface-strong/60" />
            </div>
            <div className="h-5 w-3/4 animate-pulse rounded bg-brand-surface-strong/70" />
            <div className="space-y-1.5 pt-1">
              <div className="h-3.5 w-full animate-pulse rounded bg-brand-surface-strong/50" />
              <div className="h-3.5 w-5/6 animate-pulse rounded bg-brand-surface-strong/50" />
            </div>
            <div className="flex gap-1.5 pt-2">
              <div className="h-5.5 w-12 animate-pulse rounded-[6px] bg-brand-surface-strong/60" />
              <div className="h-5.5 w-14 animate-pulse rounded-[6px] bg-brand-surface-strong/60" />
            </div>
            <div className="mt-auto pt-4 border-t border-brand-hairline/60 flex justify-between">
              <div className="h-4 w-12 animate-pulse rounded bg-brand-surface-strong/60" />
              <div className="h-4 w-16 animate-pulse rounded bg-brand-surface-strong/60" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview statistics cards (Only shown to business owners managing their posts) */}
      {canManage && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Gig Posts", value: stats.total, icon: Briefcase, color: "text-brand-ink" },
            { label: "Active Listings", value: stats.published, icon: CheckCircle2, color: "text-brand-success" },
            { label: "Draft Postings", value: stats.drafts, icon: FileText, color: "text-brand-muted" },
            { label: "Completed Gigs", value: stats.completed, icon: CheckCircle2, color: "text-brand-info" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-[12px] border border-brand-hairline bg-white p-5 shadow-sm"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">{item.label}</p>
                <p className="text-2xl font-bold text-brand-ink leading-none">{item.value}</p>
              </div>
              <div className="rounded-full bg-brand-surface-soft p-3 text-brand-muted">
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search gig title, description, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-white rounded-[10px] border border-brand-hairline outline-none focus:border-brand-info-border shadow-sm placeholder:text-brand-muted"
          />
        </div>

        {/* Right: Status Tabs and Categories Dropdown */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Status Tabs */}
          {canManage && (
            <div className="flex items-center gap-1 rounded-[10px] border border-brand-hairline bg-brand-surface-soft p-1 h-11 shrink-0 select-none">
              {["All", "Published", "Draft", "Completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    "rounded-[8px] px-3.5 h-full text-xs font-semibold transition-colors",
                    selectedStatus === status
                      ? "bg-white text-brand-ink shadow-sm"
                      : "text-brand-muted hover:text-brand-ink"
                  )}
                >
                  {status === "All" ? "All Gigs" : status}
                </button>
              ))}
            </div>
          )}

          {/* Categories dropdown filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 px-3 text-xs font-semibold bg-white rounded-[10px] border border-brand-hairline outline-none focus:border-brand-info-border shadow-sm text-brand-body"
          >
            <option value="All">All Categories</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Jobs Listing */}
      {isLoading ? (
        renderSkeletons()
      ) : filteredJobs.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.jobId}
                job={job}
                onClick={() => onCardClick(job)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-[12px] border border-brand-hairline bg-white py-20 px-4 text-center shadow-sm"
        >
          <div className="grid h-14 w-14 place-items-center rounded-[12px] bg-brand-surface-soft text-brand-muted border border-brand-hairline/40">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-brand-ink">
            {jobs.length === 0 ? "No gig postings yet" : "No matching gigs found"}
          </h3>
          <p className="mt-1 max-w-xs text-xs text-brand-muted leading-relaxed font-medium">
            {jobs.length === 0
              ? "Create and publish digital task postings to receive match recommendations from our local student workforce."
              : "Try adjusting your search terms or filters to locate listings."}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {jobs.length > 0 && (
              <button
                onClick={resetFilters}
                className="rounded-[8px] border border-brand-hairline bg-white px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-surface-soft transition-colors"
              >
                Reset Filters
              </button>
            )}

            {canManage && (
              <button
                onClick={onAddClick}
                className="flex items-center gap-1.5 rounded-[12px] bg-brand-ink px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-primary-active transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Post Your First Gig
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
