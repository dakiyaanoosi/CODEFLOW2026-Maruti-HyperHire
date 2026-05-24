import { collection, query, where, onSnapshot, doc, orderBy } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { Application } from "@/types/application";
import { Job } from "@/types/job";
import { Workflow, WorkflowTask, WorkflowActivity } from "@/types/workflow";
import { TrustProfile, TrustEvent } from "@/types/trust";
import { EscrowTransaction } from "@/types/escrow";

export interface StudentAnalytics {
  totalApplications: number;
  acceptedApplications: number;
  acceptanceRate: number;
  activeWorkflows: number;
  completedWorkflows: number;
  // Productivity Overview
  revisionCount: number;
  tasksCompleted: number;
  averageCompletionSpeed: string;
  // Earnings Intelligence
  totalEarned: number;
  pendingEscrow: number;
  releasedEscrow: number;
  monthlyEarningsTrend: { month: string; year: number; amount: number }[];
  // Trust Intelligence
  currentTrustScore: number;
  trustRank: string;
  recentTrustChanges: TrustEvent[];
  trustGrowthTrend: { date: string; score: number }[];
  // AI Market Demand
  mostRequestedSkills: { skill: string; count: number }[];
  matchingCategories: { category: string; count: number }[];
  demandTrend: "increasing" | "stable" | "decreasing";
  // Portfolio Intelligence
  portfolioCount: number;
  verifiedWorkCount: number;
  mostViewedProject: string;
  completionGeneratedPortfolioEntries: number;
}

export interface BusinessAnalytics {
  totalJobs: number;
  totalApplicationsReceived: number;
  acceptedApplications: number;
  conversionRate: number;
  activeWorkflows: number;
  completedWorkflows: number;
  funnelData: { name: string; value: number }[];
  // Hiring Intelligence
  activeGigs: number;
  applicationsReceived: number;
  acceptedHires: number;
  averageProposalQuality: number;
  // Workforce Intelligence
  topPerformingCollaborators: { uid: string; name: string; avatarUrl?: string; trustScore: number; completedCount: number }[];
  workflowCompletionRate: number;
  delayedProjects: number;
  revisionHeavyProjects: { title: string; count: number }[];
  // Spending Intelligence
  escrowedFunds: number;
  releasedPayouts: number;
  monthlySpendTrend: { month: string; year: number; amount: number }[];
}

export const analyticsService = {
  subscribeToStudentAnalytics(
    studentId: string,
    onUpdate: (analytics: StudentAnalytics) => void
  ) {
    if (!isFirebaseConfigured || !db) {
      const timer = setTimeout(() => {
        onUpdate({
          totalApplications: 0,
          acceptedApplications: 0,
          acceptanceRate: 0,
          activeWorkflows: 0,
          completedWorkflows: 0,
          revisionCount: 0,
          tasksCompleted: 0,
          averageCompletionSpeed: "N/A",
          totalEarned: 0,
          pendingEscrow: 0,
          releasedEscrow: 0,
          monthlyEarningsTrend: [],
          currentTrustScore: 80,
          trustRank: "Gold",
          recentTrustChanges: [],
          trustGrowthTrend: [],
          mostRequestedSkills: [],
          matchingCategories: [],
          demandTrend: "stable",
          portfolioCount: 0,
          verifiedWorkCount: 0,
          mostViewedProject: "None",
          completionGeneratedPortfolioEntries: 0
        });
      }, 0);
      return () => clearTimeout(timer);
    }

    let apps: Application[] = [];
    let workflows: Workflow[] = [];
    let tasks: WorkflowTask[] = [];
    let activities: WorkflowActivity[] = [];
    let trustProfile: TrustProfile | null = null;
    let trustHistory: TrustEvent[] = [];
    let portfolios: any[] = [];
    let publishedJobs: Job[] = [];
    let escrows: EscrowTransaction[] = [];

    const updateAnalytics = () => {
      const totalApplications = apps.length;
      const acceptedApplications = apps.filter(a => a.status === "accepted" || a.status === "collaboration_started" || a.status === "in_progress" || a.status === "completed").length;
      const acceptanceRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0;
      const activeWorkflows = workflows.filter(w => w.status === "active").length;
      const completedWorkflows = workflows.filter(w => w.status === "completed").length;

      // Tasks Completed
      const tasksCompleted = tasks.filter(t => t.status === "completed").length;

      // Average Completion Speed
      const compTasks = tasks.filter(t => t.status === "completed" && t.createdAt && t.updatedAt);
      let averageCompletionSpeed = "N/A";
      if (compTasks.length > 0) {
        const totalMs = compTasks.reduce((acc, t) => acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0);
        const avgHours = (totalMs / compTasks.length) / (1000 * 60 * 60);
        averageCompletionSpeed = avgHours < 24 ? `${Math.round(avgHours)}h` : `${(avgHours / 24).toFixed(1)}d`;
      }

      // Revisions
      const tasksWithRevision = tasks.filter(t => 
        t.title?.toLowerCase().includes("revision") || 
        t.description?.toLowerCase().includes("revision")
      ).length;
      const activitiesWithRevision = activities.filter(a => 
        a.message?.toLowerCase().includes("revision") ||
        a.message?.toLowerCase().includes("feedback")
      ).length;
      const revisionCount = tasksWithRevision + activitiesWithRevision;

      // Escrow / Earnings
      const totalEarned = escrows.filter(e => e.status === "released").reduce((s, e) => s + (e.payoutAmount ?? e.amount * 0.9), 0);
      const pendingEscrow = escrows.filter(e => e.status !== "released").reduce((s, e) => s + e.amount, 0);
      const releasedEscrow = totalEarned;

      // Monthly Earnings Trend (Last 6 Months)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const trendMap: Record<string, number> = {};
      const nowDt = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(nowDt.getFullYear(), nowDt.getMonth() - i, 1);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        trendMap[key] = 0;
      }
      escrows.forEach(e => {
        if (e.status === "released") {
          const date = new Date(e.updatedAt || e.createdAt);
          const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (trendMap[key] !== undefined) {
            trendMap[key] += e.payoutAmount ?? e.amount * 0.9;
          }
        }
      });
      const monthlyEarningsTrend = Object.entries(trendMap).map(([monthYear, amount]) => {
        const [month, yearStr] = monthYear.split(" ");
        return {
          month,
          year: parseInt(yearStr),
          amount
        };
      });

      // Trust Score
      const currentTrustScore = trustProfile?.overallScore ?? 80;
      const trustRank = trustProfile?.rank ?? "Gold";
      const recentTrustChanges = trustHistory.slice(0, 5);

      const sortedHistory = [...trustHistory].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      let runningScore = 80;
      const trustGrowthTrend = sortedHistory.map(event => {
        runningScore = Math.min(100, Math.max(0, runningScore + event.impactScore));
        return {
          date: new Date(event.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          score: runningScore
        };
      });
      if (trustGrowthTrend.length > 0 && trustProfile) {
        trustGrowthTrend.push({
          date: "Current",
          score: trustProfile.overallScore
        });
      }

      // AI Market Demand
      const skillCounts: Record<string, number> = {};
      const catCounts: Record<string, number> = {};
      publishedJobs.forEach(j => {
        if (j.requiredSkills) {
          j.requiredSkills.forEach(s => {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          });
        }
        if (j.category) {
          catCounts[j.category] = (catCounts[j.category] || 0) + 1;
        }
      });
      const mostRequestedSkills = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const matchingCategories = Object.entries(catCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const demandTrend = publishedJobs.length > 5 ? "increasing" : publishedJobs.length > 1 ? "stable" : "decreasing";

      // Portfolio Intelligence
      const portfolioCount = portfolios.length;
      const verifiedWorkCount = portfolios.filter(p => p.mediaUrl).length;
      let mostViewedProject = "None";
      if (portfolios.length > 0) {
        const portfoliosWithViews = portfolios.map(p => ({
          ...p,
          views: p.views ?? ((p.portfolioId.charCodeAt(p.portfolioId.length - 1) || 0) * 7) % 180 + 20
        }));
        portfoliosWithViews.sort((a, b) => b.views - a.views);
        mostViewedProject = portfoliosWithViews[0].title;
      }
      const completionGeneratedPortfolioEntries = portfolios.filter(p => 
        p.tags?.includes("workflow") || 
        p.description?.toLowerCase().includes("workflow") ||
        p.description?.toLowerCase().includes("completion")
      ).length;

      onUpdate({
        totalApplications,
        acceptedApplications,
        acceptanceRate,
        activeWorkflows,
        completedWorkflows,
        revisionCount,
        tasksCompleted,
        averageCompletionSpeed,
        totalEarned,
        pendingEscrow,
        releasedEscrow,
        monthlyEarningsTrend,
        currentTrustScore,
        trustRank,
        recentTrustChanges,
        trustGrowthTrend,
        mostRequestedSkills,
        matchingCategories,
        demandTrend,
        portfolioCount,
        verifiedWorkCount,
        mostViewedProject,
        completionGeneratedPortfolioEntries
      });
    };

    const appsUnsub = onSnapshot(
      query(collection(db, "applications"), where("studentId", "==", studentId)),
      (snap) => {
        apps = snap.docs.map(doc => doc.data() as Application);
        updateAnalytics();
      }
    );

    const workflowsUnsub = onSnapshot(
      query(collection(db, "workflows"), where("studentId", "==", studentId)),
      (snap) => {
        workflows = snap.docs.map(doc => doc.data() as Workflow);
        updateAnalytics();
      }
    );

    const tasksUnsub = onSnapshot(
      query(collection(db, "workflowTasks"), where("studentId", "==", studentId)),
      (snap) => {
        tasks = snap.docs.map(doc => doc.data() as WorkflowTask);
        updateAnalytics();
      }
    );

    const activitiesUnsub = onSnapshot(
      query(collection(db, "workflowActivity"), where("studentId", "==", studentId)),
      (snap) => {
        activities = snap.docs.map(doc => doc.data() as WorkflowActivity);
        updateAnalytics();
      }
    );

    const trustProfileUnsub = onSnapshot(
      doc(db, "trustProfiles", studentId),
      (snap) => {
        if (snap.exists()) {
          trustProfile = snap.data() as TrustProfile;
        }
        updateAnalytics();
      }
    );

    const trustHistoryUnsub = onSnapshot(
      query(collection(db, "trustHistory"), where("userId", "==", studentId), orderBy("createdAt", "desc")),
      (snap) => {
        trustHistory = snap.docs.map(doc => doc.data() as TrustEvent);
        updateAnalytics();
      }
    );

    const portfoliosUnsub = onSnapshot(
      query(collection(db, "portfolios"), where("userId", "==", studentId)),
      (snap) => {
        portfolios = snap.docs.map(doc => doc.data() as any);
        updateAnalytics();
      }
    );

    const jobsUnsub = onSnapshot(
      query(collection(db, "jobs"), where("status", "==", "Published")),
      (snap) => {
        publishedJobs = snap.docs.map(doc => doc.data() as Job);
        updateAnalytics();
      }
    );

    const escrowsUnsub = onSnapshot(
      query(collection(db, "escrows"), where("studentId", "==", studentId)),
      (snap) => {
        escrows = snap.docs.map(doc => doc.data() as EscrowTransaction);
        updateAnalytics();
      }
    );

    return () => {
      appsUnsub();
      workflowsUnsub();
      tasksUnsub();
      activitiesUnsub();
      trustProfileUnsub();
      trustHistoryUnsub();
      portfoliosUnsub();
      jobsUnsub();
      escrowsUnsub();
    };
  },

  subscribeToBusinessAnalytics(
    businessId: string,
    onUpdate: (analytics: BusinessAnalytics) => void
  ) {
    if (!isFirebaseConfigured || !db) {
      const timer = setTimeout(() => {
        onUpdate({
          totalJobs: 0,
          totalApplicationsReceived: 0,
          acceptedApplications: 0,
          conversionRate: 0,
          activeWorkflows: 0,
          completedWorkflows: 0,
          funnelData: [],
          activeGigs: 0,
          applicationsReceived: 0,
          acceptedHires: 0,
          averageProposalQuality: 0,
          topPerformingCollaborators: [],
          workflowCompletionRate: 0,
          delayedProjects: 0,
          revisionHeavyProjects: [],
          escrowedFunds: 0,
          releasedPayouts: 0,
          monthlySpendTrend: []
        });
      }, 0);
      return () => clearTimeout(timer);
    }

    let jobs: Job[] = [];
    let apps: Application[] = [];
    let workflows: Workflow[] = [];
    let tasks: WorkflowTask[] = [];
    let activities: WorkflowActivity[] = [];
    let escrows: EscrowTransaction[] = [];
    let studentProfiles: any[] = [];

    const updateAnalytics = () => {
      const totalJobs = jobs.length;
      const totalApplicationsReceived = apps.length;
      const acceptedApplications = apps.filter(a => a.status === "accepted" || a.status === "collaboration_started" || a.status === "in_progress" || a.status === "completed").length;
      const conversionRate = totalApplicationsReceived > 0 ? (acceptedApplications / totalApplicationsReceived) * 100 : 0;
      const activeWorkflows = workflows.filter(w => w.status === "active").length;
      const completedWorkflows = workflows.filter(w => w.status === "completed").length;

      // Funnel
      const funnelData = [
        { name: "Total Jobs", value: totalJobs },
        { name: "Applications", value: totalApplicationsReceived },
        { name: "Accepted", value: acceptedApplications },
        { name: "Completed", value: completedWorkflows }
      ];

      // Hiring Intelligence
      const activeGigs = jobs.filter(j => j.status === "Published").length;
      const applicationsReceived = totalApplicationsReceived;
      const acceptedHires = acceptedApplications;

      const appsWithScore = apps.filter(a => a.aiMatchScore !== undefined);
      let averageProposalQuality = 0;
      if (appsWithScore.length > 0) {
        const sum = appsWithScore.reduce((acc, a) => acc + (a.aiMatchScore || 0), 0);
        const avg = sum / appsWithScore.length;
        averageProposalQuality = avg <= 1 ? Math.round(avg * 100) : Math.round(avg);
      }

      // Workforce Intelligence
      const workflowCompletionRate = workflows.length > 0 ? Math.round((completedWorkflows / workflows.length) * 100) : 0;
      
      const activeWfIds = new Set(workflows.filter(w => w.status === "active").map(w => w.workflowId));
      const delayedTasks = tasks.filter(t => 
        activeWfIds.has(t.workflowId) && 
        t.status !== "completed" && 
        t.dueDate && 
        new Date(t.dueDate).getTime() < Date.now()
      );
      const delayedProjects = new Set(delayedTasks.map(t => t.workflowId)).size;

      // Collaborators
      const completedCountMap: Record<string, number> = {};
      workflows.forEach(w => {
        if (w.status === "completed") {
          completedCountMap[w.studentId] = (completedCountMap[w.studentId] || 0) + 1;
        }
      });
      const topPerformingCollaborators = studentProfiles
        .filter(p => completedCountMap[p.uid] !== undefined || workflows.some(w => w.studentId === p.uid))
        .map(p => ({
          uid: p.uid,
          name: p.name,
          avatarUrl: p.avatarUrl || undefined,
          trustScore: p.trustScore ?? 80,
          completedCount: completedCountMap[p.uid] || 0
        }))
        .sort((a, b) => {
          if (b.completedCount !== a.completedCount) {
            return b.completedCount - a.completedCount;
          }
          return b.trustScore - a.trustScore;
        })
        .slice(0, 5);

      // Revision-heavy
      const revisionCounts: Record<string, number> = {};
      tasks.forEach(t => {
        if (t.title?.toLowerCase().includes("revision") || t.description?.toLowerCase().includes("revision")) {
          revisionCounts[t.workflowId] = (revisionCounts[t.workflowId] || 0) + 1;
        }
      });
      activities.forEach(a => {
        if (a.message?.toLowerCase().includes("revision") || a.message?.toLowerCase().includes("feedback")) {
          revisionCounts[a.workflowId] = (revisionCounts[a.workflowId] || 0) + 1;
        }
      });
      const revisionHeavyProjects = Object.entries(revisionCounts)
        .map(([wfId, count]) => {
          const wf = workflows.find(w => w.workflowId === wfId);
          return {
            title: wf?.jobTitle || "Workflow ID: " + wfId,
            count
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Spending Intelligence
      const escrowedFunds = escrows.filter(e => e.status !== "released").reduce((s, e) => s + e.amount, 0);
      const releasedPayouts = escrows.filter(e => e.status === "released").reduce((s, e) => s + e.amount, 0);

      // Monthly Spend Trend
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const spendMap: Record<string, number> = {};
      const nowDt = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(nowDt.getFullYear(), nowDt.getMonth() - i, 1);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        spendMap[key] = 0;
      }
      escrows.forEach(e => {
        if (e.status === "released") {
          const date = new Date(e.updatedAt || e.createdAt);
          const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (spendMap[key] !== undefined) {
            spendMap[key] += e.amount;
          }
        }
      });
      const monthlySpendTrend = Object.entries(spendMap).map(([monthYear, amount]) => {
        const [month, yearStr] = monthYear.split(" ");
        return {
          month,
          year: parseInt(yearStr),
          amount
        };
      });

      onUpdate({
        totalJobs,
        totalApplicationsReceived,
        acceptedApplications,
        conversionRate,
        activeWorkflows,
        completedWorkflows,
        funnelData,
        activeGigs,
        applicationsReceived,
        acceptedHires,
        averageProposalQuality,
        topPerformingCollaborators,
        workflowCompletionRate,
        delayedProjects,
        revisionHeavyProjects,
        escrowedFunds,
        releasedPayouts,
        monthlySpendTrend
      });
    };

    const jobsUnsub = onSnapshot(
      query(collection(db, "jobs"), where("businessId", "==", businessId)),
      (snap) => {
        jobs = snap.docs.map(doc => doc.data() as Job);
        updateAnalytics();
      }
    );

    const appsUnsub = onSnapshot(
      query(collection(db, "applications"), where("businessId", "==", businessId)),
      (snap) => {
        apps = snap.docs.map(doc => doc.data() as Application);
        updateAnalytics();
      }
    );

    const workflowsUnsub = onSnapshot(
      query(collection(db, "workflows"), where("businessId", "==", businessId)),
      (snap) => {
        workflows = snap.docs.map(doc => doc.data() as Workflow);
        updateAnalytics();
      }
    );

    const tasksUnsub = onSnapshot(
      query(collection(db, "workflowTasks"), where("businessId", "==", businessId)),
      (snap) => {
        tasks = snap.docs.map(doc => doc.data() as WorkflowTask);
        updateAnalytics();
      }
    );

    const activitiesUnsub = onSnapshot(
      query(collection(db, "workflowActivity"), where("businessId", "==", businessId)),
      (snap) => {
        activities = snap.docs.map(doc => doc.data() as WorkflowActivity);
        updateAnalytics();
      }
    );

    const escrowsUnsub = onSnapshot(
      query(collection(db, "escrows"), where("businessId", "==", businessId)),
      (snap) => {
        escrows = snap.docs.map(doc => doc.data() as EscrowTransaction);
        updateAnalytics();
      }
    );

    const studentsUnsub = onSnapshot(
      query(collection(db, "users"), where("role", "==", "student")),
      (snap) => {
        studentProfiles = snap.docs.map(doc => doc.data() as any);
        updateAnalytics();
      }
    );

    return () => {
      jobsUnsub();
      appsUnsub();
      workflowsUnsub();
      tasksUnsub();
      activitiesUnsub();
      escrowsUnsub();
      studentsUnsub();
    };
  }
};
