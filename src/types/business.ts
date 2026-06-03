export type Industry =
  | "Technology"
  | "Design & Creative"
  | "Marketing"
  | "Finance"
  | "Healthcare"
  | "Education"
  | "E-Commerce"
  | "Media & Entertainment"
  | "Consulting"
  | "Other";

export type TeamSize =
  | "1–10"
  | "11–50"
  | "51–200"
  | "201–500"
  | "500+";

export type BudgetRange =
  | "< ₹10k/mo"
  | "₹10k–₹30k/mo"
  | "₹30k–₹80k/mo"
  | "₹80k–₹1.5L/mo"
  | "₹1.5L+/mo";

export interface HiringPreferences {
  remote: boolean;
  partTime: boolean;
  fullTime: boolean;
  internship: boolean;
}

export interface ActivityAnalytics {
  jobsPosted: number;
  totalHires: number;
  activeListings: number;
  avgResponseHours: number;
}

export interface BusinessProfile {
  businessId: string;
  ownerId: string;
  companyName: string;
  industry: Industry;
  description: string;
  location: string;
  website?: string;
  companySize: TeamSize; // Maps to teamSize
  hiringPreferences: HiringPreferences;
  budgetRange: BudgetRange;
  logoUrl?: string;
  verificationStatus: "Verified" | "Unverified";
  activeJobs: number;
  totalHires: number;
  createdAt: string;
  updatedAt: string;
  
  // Backward compatibility fields for legacy UI components
  isVerified?: boolean;
  logoInitials?: string;
  teamSize?: TeamSize; // alias
  analytics?: ActivityAnalytics;
}

export const ALL_INDUSTRIES: Industry[] = [
  "Technology",
  "Design & Creative",
  "Marketing",
  "Finance",
  "Healthcare",
  "Education",
  "E-Commerce",
  "Media & Entertainment",
  "Consulting",
  "Other",
];

export const ALL_TEAM_SIZES: TeamSize[] = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "500+",
];

export const ALL_BUDGET_RANGES: BudgetRange[] = [
  "< ₹10k/mo",
  "₹10k–₹30k/mo",
  "₹30k–₹80k/mo",
  "₹80k–₹1.5L/mo",
  "₹1.5L+/mo",
];
