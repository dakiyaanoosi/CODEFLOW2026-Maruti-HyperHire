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
  | "< $500/mo"
  | "$500–$2k/mo"
  | "$2k–$5k/mo"
  | "$5k–$10k/mo"
  | "$10k+/mo";

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
  companyName: string;
  industry: Industry;
  description: string;
  budgetRange: BudgetRange;
  teamSize: TeamSize;
  location: string;
  hiringPreferences: HiringPreferences;
  // Visual
  isVerified: boolean;
  logoInitials: string;
  analytics: ActivityAnalytics;
}

export const MOCK_BUSINESS_PROFILE: BusinessProfile = {
  companyName: "NexaStack Solutions",
  industry: "Technology",
  description:
    "We build modern SaaS tools for hyperlocal businesses. Our team ships fast, iterates faster, and believes in student talent as the future of the workforce.",
  budgetRange: "$2k–$5k/mo",
  teamSize: "11–50",
  location: "Bangalore, India",
  hiringPreferences: {
    remote: true,
    partTime: true,
    fullTime: false,
    internship: true,
  },
  isVerified: true,
  logoInitials: "NS",
  analytics: {
    jobsPosted: 14,
    totalHires: 9,
    activeListings: 3,
    avgResponseHours: 6,
  },
};

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
  "< $500/mo",
  "$500–$2k/mo",
  "$2k–$5k/mo",
  "$5k–$10k/mo",
  "$10k+/mo",
];
