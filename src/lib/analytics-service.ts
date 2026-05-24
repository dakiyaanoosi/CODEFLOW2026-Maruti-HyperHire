import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { Application } from "@/types/application";
import { Job } from "@/types/job";
import { Workflow } from "@/types/workflow";

export interface StudentAnalytics {
  totalApplications: number;
  acceptedApplications: number;
  acceptanceRate: number;
  activeWorkflows: number;
  completedWorkflows: number;
}

export interface BusinessAnalytics {
  totalJobs: number;
  totalApplicationsReceived: number;
  acceptedApplications: number;
  conversionRate: number;
  activeWorkflows: number;
  completedWorkflows: number;
  funnelData: { name: string; value: number }[];
}

export const analyticsService = {
  subscribeToStudentAnalytics(
    studentId: string,
    onUpdate: (analytics: StudentAnalytics) => void
  ) {
    if (!db) return () => {};

    let apps: Application[] = [];
    let workflows: Workflow[] = [];

    const updateAnalytics = () => {
      const totalApplications = apps.length;
      const acceptedApplications = apps.filter(a => a.status === "accepted").length;
      const acceptanceRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0;
      const activeWorkflows = workflows.filter(w => w.status === "active").length;
      const completedWorkflows = workflows.filter(w => w.status === "completed").length;

      onUpdate({
        totalApplications,
        acceptedApplications,
        acceptanceRate,
        activeWorkflows,
        completedWorkflows
      });
    };

    const appsUnsub = onSnapshot(
      query(collection(db, "applications"), where("studentId", "==", studentId)),
      (snapshot) => {
        apps = snapshot.docs.map(doc => doc.data() as Application);
        updateAnalytics();
      }
    );

    const workflowsUnsub = onSnapshot(
      query(collection(db, "workflows"), where("studentId", "==", studentId)),
      (snapshot) => {
        workflows = snapshot.docs.map(doc => doc.data() as Workflow);
        updateAnalytics();
      }
    );

    return () => {
      appsUnsub();
      workflowsUnsub();
    };
  },

  subscribeToBusinessAnalytics(
    businessId: string,
    onUpdate: (analytics: BusinessAnalytics) => void
  ) {
    if (!db) return () => {};

    let jobs: Job[] = [];
    let apps: Application[] = [];
    let workflows: Workflow[] = [];

    const updateAnalytics = () => {
      const totalJobs = jobs.length;
      const totalApplicationsReceived = apps.length;
      const acceptedApplications = apps.filter(a => a.status === "accepted").length;
      const conversionRate = totalApplicationsReceived > 0 ? (acceptedApplications / totalApplicationsReceived) * 100 : 0;
      const activeWorkflows = workflows.filter(w => w.status === "active").length;
      const completedWorkflows = workflows.filter(w => w.status === "completed").length;

      const funnelData = [
        { name: "Total Jobs", value: totalJobs },
        { name: "Applications", value: totalApplicationsReceived },
        { name: "Accepted", value: acceptedApplications },
        { name: "Completed", value: completedWorkflows }
      ];

      onUpdate({
        totalJobs,
        totalApplicationsReceived,
        acceptedApplications,
        conversionRate,
        activeWorkflows,
        completedWorkflows,
        funnelData
      });
    };

    const jobsUnsub = onSnapshot(
      query(collection(db, "jobs"), where("businessId", "==", businessId)),
      (snapshot) => {
        jobs = snapshot.docs.map(doc => doc.data() as Job);
        updateAnalytics();
      }
    );

    const appsUnsub = onSnapshot(
      query(collection(db, "applications"), where("businessId", "==", businessId)),
      (snapshot) => {
        apps = snapshot.docs.map(doc => doc.data() as Application);
        updateAnalytics();
      }
    );

    const workflowsUnsub = onSnapshot(
      query(collection(db, "workflows"), where("businessId", "==", businessId)),
      (snapshot) => {
        workflows = snapshot.docs.map(doc => doc.data() as Workflow);
        updateAnalytics();
      }
    );

    return () => {
      jobsUnsub();
      appsUnsub();
      workflowsUnsub();
    };
  }
};
