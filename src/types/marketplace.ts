import { Job } from "./job";

export type SortOption = "relevance" | "deadline" | "budget-high" | "budget-low" | "newest";
export type DeadlineFilter = "all" | "this-week" | "this-month" | "next-month";

export interface MarketplaceFilters {
  search: string;
  categories: string[];
  workModes: string[];
  difficulties: string[];
  sortBy: SortOption;
  deadlineFilter: DeadlineFilter;
  budgetMin: number | null;
  budgetMax: number | null;
  skills: string[];
}

export interface JobWithMatchScore extends Job {
  matchScore: number;       // 0-100 AI match percentage
  isTrending: boolean;      // based on recency + category heat
  isNew: boolean;           // posted within last 48h
}

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Best Match" },
  { value: "newest", label: "Newest First" },
  { value: "deadline", label: "Deadline (Soonest)" },
  { value: "budget-high", label: "Budget: High to Low" },
  { value: "budget-low", label: "Budget: Low to High" },
];

export const DEADLINE_FILTERS: { value: DeadlineFilter; label: string }[] = [
  { value: "all", label: "Any Deadline" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
  { value: "next-month", label: "Next Month" },
];

export const TRENDING_CATEGORIES = [
  "Web Development",
  "Machine Learning",
  "UI/UX Design",
  "Data Science",
];
