/**
 * earnings-service.ts
 * ---------------------------------------------------------------------------
 * Mock data service for the Earnings Dashboard (Feature #19).
 * Replace the mock functions with real Firestore / API calls when the backend
 * is wired up.  The shapes returned already match the types in @/types/earnings.
 */

import type {
  StudentEarningsSummary,
  BusinessEarningsSummary,
} from "@/types/earnings";

// ─── Student ─────────────────────────────────────────────────────────────────

export async function getStudentEarnings(
  _uid: string
): Promise<StudentEarningsSummary> {
  // TODO: replace with Firestore read
  return {
    totalEarnings: 4_820,
    currentMonthIncome: 640,
    pendingPayoutTotal: 310,
    avgRatePerHour: 18,
    completionRate: 91,
    pendingPayouts: [
      {
        payoutId: "po_001",
        jobTitle: "Landing Page Redesign",
        businessName: "Verve Studio",
        amount: 180,
        dueDate: "2026-06-01",
        status: "Processing",
      },
      {
        payoutId: "po_002",
        jobTitle: "API Integration",
        businessName: "NovaTech",
        amount: 130,
        dueDate: "2026-06-05",
        status: "Pending",
      },
    ],
    monthlyHistory: [
      { month: "Nov", year: 2025, amount: 320 },
      { month: "Dec", year: 2025, amount: 510 },
      { month: "Jan", year: 2026, amount: 480 },
      { month: "Feb", year: 2026, amount: 600 },
      { month: "Mar", year: 2026, amount: 740 },
      { month: "Apr", year: 2026, amount: 530 },
      { month: "May", year: 2026, amount: 640 },
    ],
    jobStats: [
      { label: "Applied",   count: 34 },
      { label: "Accepted",  count: 18 },
      { label: "Completed", count: 15 },
      { label: "Rejected",  count: 8  },
    ],
  };
}

// ─── Business ─────────────────────────────────────────────────────────────────

export async function getBusinessEarnings(
  _uid: string
): Promise<BusinessEarningsSummary> {
  // TODO: replace with Firestore read
  return {
    totalSpend: 12_450,
    currentMonthSpend: 1_820,
    activeProjectCount: 6,
    hiredCount: 22,
    avgTimeToHire: 4.2,
    hiringEfficiencyRate: 68,
    monthlySpend: [
      { month: "Nov", year: 2025, amount: 940 },
      { month: "Dec", year: 2025, amount: 1_200 },
      { month: "Jan", year: 2026, amount: 1_580 },
      { month: "Feb", year: 2026, amount: 1_340 },
      { month: "Mar", year: 2026, amount: 2_100 },
      { month: "Apr", year: 2026, amount: 1_470 },
      { month: "May", year: 2026, amount: 1_820 },
    ],
    projectCosts: [
      {
        jobTitle: "Brand Identity Kit",
        category: "UI/UX Design",
        spent: 520,
        budget: 600,
        studentName: "Ananya Sharma",
        completedAt: "2026-04-20",
      },
      {
        jobTitle: "Backend API v2",
        category: "Backend Engineering",
        spent: 740,
        budget: 800,
        studentName: "Rohan Mehta",
        completedAt: "2026-04-30",
      },
      {
        jobTitle: "Marketing Campaign",
        category: "Digital Marketing",
        spent: 280,
        budget: 350,
        studentName: "Priya Singh",
        completedAt: undefined,
      },
      {
        jobTitle: "ML Model Integration",
        category: "Machine Learning",
        spent: 920,
        budget: 1_000,
        studentName: "Dev Kapoor",
        completedAt: "2026-05-10",
      },
      {
        jobTitle: "Mobile App UI",
        category: "Mobile Development",
        spent: 480,
        budget: 550,
        studentName: "Fatima Noor",
        completedAt: undefined,
      },
    ],
  };
}
