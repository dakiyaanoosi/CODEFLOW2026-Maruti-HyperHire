"use client";

import * as React from "react";
import { Search, FolderOpen, Plus, Loader2 } from "lucide-react";
import { PortfolioItem } from "@/types/portfolio";
import { ALL_CATEGORIES } from "@/types/profile";
import { PortfolioCard } from "./PortfolioCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PortfolioGridProps {
  items: PortfolioItem[];
  isLoading: boolean;
  onCardClick: (item: PortfolioItem) => void;
  onAddClick: () => void;
  canManage?: boolean;
}

export function PortfolioGrid({
  items,
  isLoading,
  onCardClick,
  onAddClick,
  canManage = true,
}: PortfolioGridProps) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
  };

  // Filtered portfolios list
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        search.trim() === "" ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategory]);

  // Loading skeleton placeholder cards
  const renderSkeletons = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col overflow-hidden rounded-[12px] border border-brand-hairline bg-white shadow-sm"
          >
            {/* Image block */}
            <div className="aspect-[4/3] w-full animate-pulse bg-brand-surface-strong/60" />
            {/* Detail lines */}
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-brand-surface-strong/70" />
              <div className="space-y-1.5">
                <div className="h-3 w-full animate-pulse rounded bg-brand-surface-strong/50" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-brand-surface-strong/50" />
              </div>
              <div className="flex gap-1.5 pt-1">
                <div className="h-5 w-12 animate-pulse rounded-[6px] bg-brand-surface-strong/60" />
                <div className="h-5 w-14 animate-pulse rounded-[6px] bg-brand-surface-strong/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and filter toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search projects, tags, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-white rounded-[10px] border border-brand-hairline outline-none focus:border-brand-info-border shadow-sm placeholder:text-brand-muted"
          />
        </div>

        {/* Categories Rail */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none shrink-0">
          <button
            onClick={() => setSelectedCategory("All")}
            className={cn(
              "rounded-[8px] px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border",
              selectedCategory === "All"
                ? "bg-brand-ink border-brand-ink text-white"
                : "bg-white border-brand-hairline text-brand-muted hover:text-brand-ink hover:border-brand-ink"
            )}
          >
            All Categories
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-[8px] px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border",
                selectedCategory === cat
                  ? "bg-brand-ink border-brand-ink text-white"
                  : "bg-white border-brand-hairline text-brand-muted hover:text-brand-ink hover:border-brand-ink"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid display */}
      {isLoading ? (
        renderSkeletons()
      ) : filteredItems.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <PortfolioCard
                key={item.portfolioId}
                item={item}
                onClick={() => onCardClick(item)}
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
            {items.length === 0 ? "Your portfolio is empty" : "No matching projects"}
          </h3>
          <p className="mt-1 max-w-xs text-xs text-brand-muted leading-relaxed font-medium">
            {items.length === 0
              ? "Showcase your capabilities. Upload images, videos, or PDFs of your past work to stand out to employers."
              : "We couldn't find any projects matching your search term or chosen category."}
          </p>
          
          <div className="mt-6 flex items-center gap-3">
            {items.length > 0 && (
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
                Upload Your First Project
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
