/**
 * earnings-service.ts
 * ---------------------------------------------------------------------------
 * Real Firestore-backed earnings service for the Earnings Dashboard.
 */

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { profileService } from "./profile-service";
import type {
  StudentEarningsSummary,
  BusinessEarningsSummary,
  MonthlyEarning,
  PendingPayout,
  BusinessSpendEntry,
  ProjectCostEntry,
} from "@/types/earnings";

// Helper for monthly history grouping
function getMonthlyHistory(
  escrows: any[],
  statusFilter: string | null,
  dateField: string,
  amountField: string
): { month: string; year: number; amount: number }[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const historyMap: Record<string, { month: string; year: number; amount: number }> = {};
  
  const now = new Date();
  // Initialize last 7 months
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    historyMap[key] = {
      month: months[d.getMonth()],
      year: d.getFullYear(),
      amount: 0
    };
  }

  escrows.forEach(e => {
    if (statusFilter && e.status !== statusFilter) return;
    const dateVal = e[dateField];
    const dateStr = dateVal?.toDate ? dateVal.toDate().toISOString() : dateVal;
    if (!dateStr) return;
    
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (historyMap[key]) {
      historyMap[key].amount += e[amountField] || e.amount;
    }
  });

  return Object.values(historyMap);
}

// Fallback student earnings if Firestore queries fail or not configured
function getFallbackStudentEarnings(): StudentEarningsSummary {
  return {
    totalEarnings: 0,
    currentMonthIncome: 0,
    pendingPayoutTotal: 0,
    avgRatePerHour: 0,
    completionRate: 0,
    pendingPayouts: [],
    monthlyHistory: [
      { month: "Dec", year: 2025, amount: 0 },
      { month: "Jan", year: 2026, amount: 0 },
      { month: "Feb", year: 2026, amount: 0 },
      { month: "Mar", year: 2026, amount: 0 },
      { month: "Apr", year: 2026, amount: 0 },
      { month: "May", year: 2026, amount: 0 },
    ],
    jobStats: [
      { label: "Applied",   count: 0 },
      { label: "Accepted",  count: 0 },
      { label: "Completed", count: 0 },
      { label: "Rejected",  count: 0  },
    ],
  };
}

// Fallback business spend/earnings if Firestore queries fail or not configured
function getFallbackBusinessEarnings(): BusinessEarningsSummary {
  return {
    totalSpend: 0,
    currentMonthSpend: 0,
    activeProjectCount: 0,
    hiredCount: 0,
    avgTimeToHire: 0,
    hiringEfficiencyRate: 0,
    monthlySpend: [
      { month: "Dec", year: 2025, amount: 0 },
      { month: "Jan", year: 2026, amount: 0 },
      { month: "Feb", year: 2026, amount: 0 },
      { month: "Mar", year: 2026, amount: 0 },
      { month: "Apr", year: 2026, amount: 0 },
      { month: "May", year: 2026, amount: 0 },
    ],
    projectCosts: [],
  };
}

// ─── Student ─────────────────────────────────────────────────────────────────

export async function getStudentEarnings(
  uid: string
): Promise<StudentEarningsSummary> {
  if (!db) {
    return getFallbackStudentEarnings();
  }

  try {
    // 1. Fetch escrows for student
    const escrowsQuery = query(
      collection(db, "escrows"),
      where("studentId", "==", uid)
    );
    const escrowsSnap = await getDocs(escrowsQuery);
    const escrows: any[] = [];
    escrowsSnap.forEach(d => {
      const data = d.data();
      escrows.push({ ...data, id: d.id });
    });

    // 2. Fetch applications for student
    const appsQuery = query(
      collection(db, "applications"),
      where("studentId", "==", uid)
    );
    const appsSnap = await getDocs(appsQuery);
    const applications: any[] = [];
    appsSnap.forEach(d => applications.push(d.data()));

    const totalEarnings = escrows
      .filter(e => e.status === "released")
      .reduce((sum, e) => sum + (e.payoutAmount ?? e.amount * 0.9), 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthIncome = escrows
      .filter(e => {
        if (e.status !== "released") return false;
        const dateStr = e.releasedAt?.toDate ? e.releasedAt.toDate().toISOString() : e.releasedAt;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (e.payoutAmount ?? e.amount * 0.9), 0);

    const pendingPayoutTotal = escrows
      .filter(e => e.status !== "released")
      .reduce((sum, e) => sum + (e.payoutAmount ?? e.amount * 0.9), 0);

    const pendingPayouts: PendingPayout[] = escrows
      .filter(e => e.status !== "released")
      .map(e => {
        const fundedDate = e.fundedAt?.toDate ? e.fundedAt.toDate() : (e.fundedAt ? new Date(e.fundedAt) : new Date());
        const dueDate = new Date(fundedDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        return {
          payoutId: e.id || `esc_${e.applicationId}`,
          jobTitle: e.jobTitle || "Marketplace Collaboration",
          businessName: e.businessName || "Partner Client",
          amount: e.payoutAmount ?? e.amount * 0.9,
          dueDate,
          status: e.status === "completed" ? "Processing" : "Pending",
        };
      });

    const monthlyHistory = getMonthlyHistory(escrows, "released", "releasedAt", "payoutAmount");

    const appliedCount = applications.length;
    const acceptedCount = applications.filter(a => ["accepted", "collaboration_started", "in_progress", "completed"].includes(a.status)).length;
    const completedCount = escrows.filter(e => e.status === "released").length;
    const rejectedCount = applications.filter(a => a.status === "rejected").length;

    const jobStats = [
      { label: "Applied",   count: appliedCount },
      { label: "Accepted",  count: acceptedCount },
      { label: "Completed", count: completedCount },
      { label: "Rejected",  count: rejectedCount },
    ];

    const totalJobs = acceptedCount + completedCount;
    const completionRate = totalJobs > 0 ? Math.round((completedCount / totalJobs) * 100) : 0;
    
    let avgRatePerHour = 0;
    try {
      const profile = await profileService.getProfile(uid);
      if (profile && profile.hourlyRate) {
        avgRatePerHour = profile.hourlyRate;
      }
    } catch (e) {
      console.error("Failed to fetch user hourlyRate:", e);
    }

    return {
      totalEarnings: Math.round(totalEarnings),
      currentMonthIncome: Math.round(currentMonthIncome),
      pendingPayoutTotal: Math.round(pendingPayoutTotal),
      pendingPayouts,
      monthlyHistory,
      jobStats,
      avgRatePerHour,
      completionRate
    };
  } catch (error) {
    console.error("Error in getStudentEarnings:", error);
    return getFallbackStudentEarnings();
  }
}

// ─── Business ─────────────────────────────────────────────────────────────────

export async function getBusinessEarnings(
  uid: string
): Promise<BusinessEarningsSummary> {
  if (!db) {
    return getFallbackBusinessEarnings();
  }

  try {
    // 1. Fetch escrows for business
    const escrowsQuery = query(
      collection(db, "escrows"),
      where("businessId", "==", uid)
    );
    const escrowsSnap = await getDocs(escrowsQuery);
    const escrows: any[] = [];
    escrowsSnap.forEach(d => {
      const data = d.data();
      escrows.push({ ...data, id: d.id });
    });

    // 2. Fetch applications for business
    const appsQuery = query(
      collection(db, "applications"),
      where("businessId", "==", uid)
    );
    const appsSnap = await getDocs(appsQuery);
    const applications: any[] = [];
    appsSnap.forEach(d => applications.push(d.data()));

    const totalSpend = escrows
      .filter(e => e.status === "released")
      .reduce((sum, e) => sum + e.amount, 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthSpend = escrows
      .filter(e => {
        if (e.status !== "released") return false;
        const dateStr = e.releasedAt?.toDate ? e.releasedAt.toDate().toISOString() : e.releasedAt;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const activeProjectCount = escrows
      .filter(e => e.status !== "released")
      .length;

    const hiredCount = applications.filter(a => ["accepted", "collaboration_started", "in_progress", "completed"].includes(a.status)).length;
    const appliedCount = applications.length;
    const hiringEfficiencyRate = appliedCount > 0 ? Math.round((hiredCount / appliedCount) * 100) : 0;
    
    // Calculate real average time to hire in days
    const hiredApps = applications.filter(a => ["accepted", "collaboration_started", "in_progress", "completed"].includes(a.status));
    let totalTimeToHireDays = 0;
    let hiredWithTimeCount = 0;
    hiredApps.forEach(a => {
      if (a.createdAt && a.updatedAt) {
        const createdTime = new Date(a.createdAt).getTime();
        const updatedTime = new Date(a.updatedAt).getTime();
        const diffDays = (updatedTime - createdTime) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0) {
          totalTimeToHireDays += diffDays;
          hiredWithTimeCount++;
        }
      }
    });
    
    const avgTimeToHire = hiredWithTimeCount > 0 
      ? Number((totalTimeToHireDays / hiredWithTimeCount).toFixed(1))
      : 0;

    const monthlySpend = getMonthlyHistory(escrows, "released", "releasedAt", "amount");

    const projectCosts: ProjectCostEntry[] = escrows.map(e => {
      const completedDate = e.releasedAt?.toDate ? e.releasedAt.toDate().toISOString() : e.releasedAt;
      return {
        jobTitle: e.jobTitle || "Marketplace Collaboration",
        category: "Milestone Deliverable",
        spent: e.status === "released" ? e.amount : 0,
        budget: e.amount,
        studentName: e.studentName || "Assigned Student",
        completedAt: completedDate || undefined
      };
    });

    return {
      totalSpend: Math.round(totalSpend),
      currentMonthSpend: Math.round(currentMonthSpend),
      activeProjectCount,
      hiredCount,
      avgTimeToHire,
      hiringEfficiencyRate,
      monthlySpend,
      projectCosts
    };
  } catch (error) {
    console.error("Error in getBusinessEarnings:", error);
    return getFallbackBusinessEarnings();
  }
}
