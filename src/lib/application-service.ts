import {
  Application,
  ApplicationFormData,
  ApplicationStatus,
} from "@/types/application";

function generateId(): string {
  return `app_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

const STORAGE_KEY = "hyperhire_applications";

function getAll(): Application[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
  } catch {
    return [];
  }
}

function saveAll(apps: Application[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(apps)
  );
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
      (a) =>
        a.jobId === jobId &&
        a.studentId === studentId
    );

    if (existing) {
      throw new Error(
        "You have already applied to this job."
      );
    }

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
      estimatedDeliveryDays:
        data.estimatedDeliveryDays,
      quotedPrice: data.quotedPrice,
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveAll([app, ...apps]);

    return app;
  },

  async getApplicationsByStudent(
    studentId: string
  ): Promise<Application[]> {
    await new Promise((r) => setTimeout(r, 400));

    return getAll().filter(
      (a) => a.studentId === studentId
    );
  },

  async getApplicationsByJob(
    jobId: string
  ): Promise<Application[]> {
    await new Promise((r) => setTimeout(r, 400));

    return getAll().filter(
      (a) => a.jobId === jobId
    );
  },

  async getApplicationsByBusiness(
    businessId: string
  ): Promise<Application[]> {
    await new Promise((r) => setTimeout(r, 400));

    return getAll().filter(
      (a) => a.businessId === businessId
    );
  },

  async updateStatus(
    applicationId: string,
    status: ApplicationStatus
  ): Promise<Application> {
    await new Promise((r) => setTimeout(r, 300));

    const apps = getAll();

    const idx = apps.findIndex(
      (a) => a.applicationId === applicationId
    );

    if (idx === -1) {
      throw new Error("Application not found.");
    }

    apps[idx] = {
      ...apps[idx],
      status,
      updatedAt: new Date().toISOString(),
    };

    saveAll(apps);

    return apps[idx];
  },

  async hasApplied(
    jobId: string,
    studentId: string
  ): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 100));

    return getAll().some(
      (a) =>
        a.jobId === jobId &&
        a.studentId === studentId
    );
  },

  async seedSampleData(
    businessId: string,
    studentId: string
  ): Promise<void> {
    const apps = getAll();

    if (apps.length > 0) return;

    const samples: Application[] = [
      {
        applicationId: "app_sample_1",
        jobId: "job_sample_1",
        jobTitle: "Frontend Dashboard",
        companyName: "Company Alpha",
        businessId,
        studentId,
        studentName: "Student One",
        coverMessage:
          "I have experience building responsive frontend applications.",
        proposalText:
          "I will deliver a clean and responsive dashboard using modern tools.",
        estimatedDeliveryDays: 7,
        quotedPrice: 450,
        status: "Shortlisted",
        createdAt: new Date(
          Date.now() - 86400000 * 2
        ).toISOString(),
        updatedAt: new Date(
          Date.now() - 86400000
        ).toISOString(),
      },
      {
        applicationId: "app_sample_2",
        jobId: "job_sample_2",
        jobTitle: "Brand Design Package",
        companyName: "Company Beta",
        businessId,
        studentId: "other_student",
        studentName: "Student Two",
        coverMessage:
          "I focus on clean branding and modern visual identity design.",
        proposalText:
          "Will provide multiple concepts along with final export files.",
        estimatedDeliveryDays: 5,
        quotedPrice: 280,
        status: "Pending",
        createdAt: new Date(
          Date.now() - 86400000
        ).toISOString(),
        updatedAt: new Date(
          Date.now() - 86400000
        ).toISOString(),
      },
    ];

    saveAll(samples);
  },
};