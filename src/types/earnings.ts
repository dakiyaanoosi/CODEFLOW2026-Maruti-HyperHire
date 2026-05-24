// ─── Earnings Domain Types ────────────────────────────────────────────────────

export interface MonthlyEarning {
  month: string;       // "Jan", "Feb", …
  year: number;
  amount: number;
}

export interface PendingPayout {
  payoutId: string;
  jobTitle: string;
  businessName: string;
  amount: number;
  dueDate: string;       // ISO date
  status: "Pending" | "Processing" | "Released";
}

export interface JobStatEntry {
  label: string;
  count: number;
}

// ─── Student View ─────────────────────────────────────────────────────────────

export interface StudentEarningsSummary {
  totalEarnings: number;
  currentMonthIncome: number;
  pendingPayoutTotal: number;
  pendingPayouts: PendingPayout[];
  monthlyHistory: MonthlyEarning[];
  jobStats: JobStatEntry[];         // e.g. Applied / Accepted / Completed / Rejected
  avgRatePerHour: number;
  completionRate: number;           // 0–100
}

// ─── Business View ────────────────────────────────────────────────────────────

export interface BusinessSpendEntry {
  month: string;
  year: number;
  amount: number;
}

export interface ProjectCostEntry {
  jobTitle: string;
  category: string;
  spent: number;
  budget: number;
  studentName: string;
  completedAt?: string;             // ISO date
}

export interface BusinessEarningsSummary {
  totalSpend: number;
  currentMonthSpend: number;
  activeProjectCount: number;
  hiredCount: number;
  avgTimeToHire: number;            // days
  hiringEfficiencyRate: number;     // 0–100, accepted / applied
  monthlySpend: BusinessSpendEntry[];
  projectCosts: ProjectCostEntry[];
}
