"use client";

import * as React from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Loader2,
  FolderOpen,
  ChevronDown,
} from "lucide-react";
import { Job } from "@/types/job";
import { JobWithMatchScore, MarketplaceFilters, SORT_OPTIONS } from "@/types/marketplace";
import { enrichJobs, applyFilters, sortJobs } from "@/lib/marketplace-utils";
import { MarketplaceJobCard } from "./MarketplaceJobCard";
import { MarketplaceFilterPanel } from "./MarketplaceFilterPanel";
import { TrendingJobsStrip } from "./TrendingJobsStrip";
import { MarketplaceJobDetailModal } from "./MarketplaceJobDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

const DEFAULT_FILTERS: MarketplaceFilters = {
  search: "",
  categories: [],
  workModes: [],
  difficulties: [],
  sortBy: "relevance",
  deadlineFilter: "all",
  budgetMin: null,
  budgetMax: null,
  skills: [],
};

interface MarketplaceFeedProps {
  jobs: Job[];
  isLoading: boolean;
  userSkills?: string[];
}

export function MarketplaceFeed({
  jobs,
  isLoading,
  userSkills = [],
}: MarketplaceFeedProps) {
  const [filters, setFilters] = React.useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [page, setPage] = React.useState(1);
  const [selectedJob, setSelectedJob] = React.useState<JobWithMatchScore | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Sentinel ref for infinite scroll
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Enrich jobs with skill fit scores
  const enrichedJobs = React.useMemo(
    () => enrichJobs(jobs, userSkills),
    [jobs, userSkills]
  );

  // Apply filters + sort
  const processedJobs = React.useMemo(() => {
    const filtered = applyFilters(enrichedJobs, filters);
    return sortJobs(filtered, filters.sortBy);
  }, [enrichedJobs, filters]);

  // Visible slice for infinite scroll
  const visibleJobs = React.useMemo(
    () => processedJobs.slice(0, page * PAGE_SIZE),
    [processedJobs, page]
  );

  const hasMore = visibleJobs.length < processedJobs.length;

  // Reset page when filters change
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [filters]);

  // Infinite scroll via IntersectionObserver
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setPage((p) => p + 1);
            setIsLoadingMore(false);
          }, 400);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const activeFilterCount =
    filters.categories.length +
    filters.workModes.length +
    filters.difficulties.length +
    (filters.deadlineFilter !== "all" ? 1 : 0) +
    (filters.budgetMin !== null ? 1 : 0) +
    (filters.budgetMax !== null ? 1 : 0) +
    filters.skills.length;

  // Loading skeletons
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[12px] border border-brand-hairline bg-white overflow-hidden"
        >
          <div className="h-[3px] w-full bg-brand-surface-strong animate-pulse" />
          <div className="p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded bg-brand-surface-strong animate-pulse" />
              <div className="h-4 w-16 rounded-[5px] bg-brand-surface-strong animate-pulse" />
            </div>
            <div className="h-5 w-3/4 rounded bg-brand-surface-strong animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-brand-surface-strong animate-pulse" />
            <div className="h-14 rounded-[8px] bg-brand-surface-soft animate-pulse" />
            <div className="flex gap-1.5">
              {[60, 72, 56].map((w, j) => (
                <div
                  key={j}
                  className="h-5 rounded-[5px] bg-brand-surface-strong animate-pulse"
                  style={{ width: w }}
                />
              ))}
            </div>
            <div className="pt-4 border-t border-brand-hairline/60 flex justify-between items-center">
              <div className="h-4 w-16 rounded bg-brand-surface-strong animate-pulse" />
              <div className="h-12 w-12 rounded-full bg-brand-surface-strong animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Trending Strip */}
      {!isLoading && enrichedJobs.length > 0 && (
        <TrendingJobsStrip
          jobs={enrichedJobs}
          onJobClick={setSelectedJob}
        />
      )}

      {/* Search + Sort Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search gigs, skills, companies..."
            className="w-full h-11 pl-10 pr-10 text-sm bg-white rounded-[10px] border border-brand-hairline outline-none focus:border-brand-info-border shadow-sm placeholder:text-brand-muted text-brand-ink"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((f) => ({ ...f, search: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                sortBy: e.target.value as MarketplaceFilters["sortBy"],
              }))
            }
            className="h-11 pl-3.5 pr-8 text-sm bg-white rounded-[10px] border border-brand-hairline outline-none focus:border-brand-info-border shadow-sm text-brand-body font-medium appearance-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted" />
        </div>

        {/* Filter Toggle (mobile / compact) */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-2 h-11 px-4 rounded-[10px] border text-sm font-semibold transition-all shadow-sm shrink-0",
            showFilters || activeFilterCount > 0
              ? "bg-brand-ink text-white border-brand-ink"
              : "bg-white text-brand-ink border-brand-hairline"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-white text-brand-ink text-[10px] font-bold min-w-[18px] px-1">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Main layout: Filters sidebar + Grid */}
      <div className="flex gap-6">
        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 240 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden"
            >
              <div
                className="rounded-[12px] border border-brand-hairline bg-white p-4 space-y-4 sticky top-4"
                style={{ width: 240 }}
              >
                <MarketplaceFilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  totalCount={enrichedJobs.length}
                  filteredCount={processedJobs.length}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Jobs Grid */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Results summary */}
          {!isLoading && (
            <div className="flex items-center justify-between text-xs text-brand-muted font-medium">
              <span>
                {processedJobs.length > 0
                  ? `${processedJobs.length} gig${processedJobs.length !== 1 ? "s" : ""} found`
                  : "No gigs match your filters"}
              </span>
              {filters.sortBy !== "relevance" && (
                <span>
                  Sorted by: <span className="text-brand-ink font-semibold">{SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label}</span>
                </span>
              )}
            </div>
          )}

          {/* Grid or loading or empty */}
          {isLoading ? (
            renderSkeletons()
          ) : visibleJobs.length > 0 ? (
            <>
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                <AnimatePresence mode="popLayout">
                  {visibleJobs.map((job, idx) => (
                    <MarketplaceJobCard
                      key={job.jobId}
                      job={job}
                      index={idx}
                      onClick={() => setSelectedJob(job)}
                      userSkills={userSkills}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="flex justify-center py-4">
                {isLoadingMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm text-brand-muted font-medium"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading more gigs…
                  </motion.div>
                )}
                {!hasMore && visibleJobs.length > PAGE_SIZE && (
                  <p className="text-xs text-brand-muted font-medium">
                    You have seen all {processedJobs.length} listings
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-[12px] border border-brand-hairline bg-white py-20 text-center"
            >
              <div className="h-12 w-12 rounded-[12px] bg-brand-surface-soft border border-brand-hairline/50 flex items-center justify-center text-brand-muted mb-4">
                <FolderOpen className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-brand-ink mb-1">
                {jobs.length === 0 ? "No active gigs available" : "No gigs match your criteria"}
              </h3>
              <p className="text-xs text-brand-muted max-w-xs leading-relaxed mb-5">
                {jobs.length === 0
                  ? "There are currently no active gigs listed in the marketplace. Check back later or create a new gig listing if you are a business."
                  : "Try adjusting your search or clearing some filters to see more listings."}
              </p>
              {jobs.length > 0 && (
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="rounded-[10px] border border-brand-hairline bg-white px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-surface-soft transition-colors"
                >
                  Reset all filters
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <MarketplaceJobDetailModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        userSkills={userSkills}
      />
    </div>
  );
}
