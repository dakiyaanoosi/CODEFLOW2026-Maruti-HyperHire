import { Application, ApplicationFormData, ApplicationStatus } from "@/types/application";

function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const STORAGE_KEY = "hyperhire_applications";

function getAll(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAll(apps: Application[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export const applicationService = {
  async submitApplication(
    data: ApplicationFormData,
    jobId: string,
    jobTitle: string,
    companyName: string,
    businessId: string,
    studentId: string,
    studentName: string,
    studentAvatar?: string
  ): Promise<Application> {
    await new Promise((r) => setTimeout(r, 600));
    const apps = getAll();
    const existing = apps.find(
      (a) => a.jobId === jobId && a.studentId === studentId
    );
    if (existing) throw new Error("You have already applied to this job.");
    const app: Application = {
      applicationId: generateId(),
      jobId,
      jobTitle,
      companyName,
      businessId,
      studentId,
      studentName,
      studentAvatar,
      coverMessage: data.coverMessage,
      proposalText: data.proposalText,
      estimatedDeliveryDays: data.estimatedDeliveryDays,
      quotedPrice: data.quotedPrice,
      status: "Pending",
      aiEnhanced: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveAll([app, ...apps]);
    return app;
  },

  async getApplicationsByStudent(studentId: string): Promise<Application[]> {
    await new Promise((r) => setTimeout(r, 400));
    return getAll().filter((a) => a.studentId === studentId);
  },

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    await new Promise((r) => setTimeout(r, 400));
    return getAll().filter((a) => a.jobId === jobId);
  },

  async getApplicationsByBusiness(businessId: string): Promise<Application[]> {
    await new Promise((r) => setTimeout(r, 400));
    return getAll().filter((a) => a.businessId === businessId);
  },

  async updateStatus(applicationId: string, status: ApplicationStatus): Promise<Application> {
    await new Promise((r) => setTimeout(r, 300));
    const apps = getAll();
    const idx = apps.findIndex((a) => a.applicationId === applicationId);
    if (idx === -1) throw new Error("Application not found.");
    apps[idx] = { ...apps[idx], status, updatedAt: new Date().toISOString() };
    saveAll(apps);
    return apps[idx];
  },

  async saveAIEnhancement(applicationId: string, enhanced: string): Promise<Application> {
    await new Promise((r) => setTimeout(r, 200));
    const apps = getAll();
    const idx = apps.findIndex((a) => a.applicationId === applicationId);
    if (idx === -1) throw new Error("Application not found.");
    apps[idx] = {
      ...apps[idx],
      aiEnhanced: true,
      aiSuggestions: enhanced,
      updatedAt: new Date().toISOString(),
    };
    saveAll(apps);
    return apps[idx];
  },

  async hasApplied(jobId: string, studentId: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 100));
    return getAll().some((a) => a.jobId === jobId && a.studentId === studentId);
  },

  async seedSampleData(businessId: string, studentId: string): Promise<void> {
    const apps = getAll();
    if (apps.length > 0) return;
    const samples: Application[] = [
      {
        applicationId: "app_sample_1",
        jobId: "job_sample_1",
        jobTitle: "React Dashboard UI",
        companyName: "TechCorp",
        businessId,
        studentId,
        studentName: "Alex Johnson",
        coverMessage: "I have 2 years of React experience and have built 3 dashboards.",
        proposalText: "I will deliver a clean, responsive dashboard using React and Tailwind.",
        estimatedDeliveryDays: 7,
        quotedPrice: 450,
        status: "Shortlisted",
        aiEnhanced: true,
        aiSuggestions: "Emphasize your TypeScript skills and mention component library experience.",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        applicationId: "app_sample_2",
        jobId: "job_sample_2",
        jobTitle: "Logo Design Package",
        companyName: "Startup Inc",
        businessId,
        studentId: "other_student",
        studentName: "Maya Patel",
        coverMessage: "I specialize in brand identity and minimalist design.",
        proposalText: "Will deliver 3 logo concepts plus final files in all formats.",
        estimatedDeliveryDays: 5,
        quotedPrice: 280,
        status: "Pending",
        aiEnhanced: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    saveAll(samples);
  },
};
