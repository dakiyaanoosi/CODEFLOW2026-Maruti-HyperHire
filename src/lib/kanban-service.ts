import { KanbanTask, KanbanStage, KanbanActivity } from "@/types/kanban";
import { Application } from "@/types/application";

const STORAGE_KEY = "hyperhire_kanban_tasks";

function generateId(): string {
  return `ktask_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function activityId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getAll(): KanbanTask[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAll(tasks: KanbanTask[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

export const kanbanService = {
  getTasksByBusiness(businessId: string): KanbanTask[] {
    return getAll().filter((t) => t.businessId === businessId);
  },

  getTasksByStudent(studentId: string): KanbanTask[] {
    return getAll().filter((t) => t.studentId === studentId);
  },

  moveStage(
    taskId: string,
    newStage: KanbanStage,
    actorName: string
  ): KanbanTask {
    const all = getAll();
    const idx = all.findIndex((t) => t.id === taskId);

    if (idx === -1) throw new Error("Task not found");

    const old = all[idx];

    const activity: KanbanActivity = {
      id: activityId(),
      type: "status_change",
      message: `Moved from ${old.stage} → ${newStage}`,
      timestamp: new Date().toISOString(),
      actorName,
    };

    const stageProgressMap: Record<KanbanStage, number> = {
      Pending: 0,
      "In Progress": 35,
      Revision: 60,
      Completed: 90,
      Paid: 100,
    };

    all[idx] = {
      ...old,
      stage: newStage,
      progress: Math.max(old.progress, stageProgressMap[newStage]),
      activityLog: [activity, ...old.activityLog],
      updatedAt: new Date().toISOString(),
    };

    saveAll(all);

    return all[idx];
  },

  updateProgress(
    taskId: string,
    progress: number,
    actorName: string
  ): KanbanTask {
    const all = getAll();
    const idx = all.findIndex((t) => t.id === taskId);

    if (idx === -1) throw new Error("Task not found");

    const activity: KanbanActivity = {
      id: activityId(),
      type: "note",
      message: `Progress updated to ${progress}%`,
      timestamp: new Date().toISOString(),
      actorName,
    };

    all[idx] = {
      ...all[idx],
      progress,
      activityLog: [activity, ...all[idx].activityLog],
      updatedAt: new Date().toISOString(),
    };

    saveAll(all);

    return all[idx];
  },

  addNote(
    taskId: string,
    note: string,
    actorName: string
  ): KanbanTask {
    const all = getAll();
    const idx = all.findIndex((t) => t.id === taskId);

    if (idx === -1) throw new Error("Task not found");

    const activity: KanbanActivity = {
      id: activityId(),
      type: "note",
      message: note,
      timestamp: new Date().toISOString(),
      actorName,
    };

    all[idx] = {
      ...all[idx],
      activityLog: [activity, ...all[idx].activityLog],
      updatedAt: new Date().toISOString(),
    };

    saveAll(all);

    return all[idx];
  },

  createFromApplication(
    app: Application,
    priority: "Low" | "Medium" | "High" = "Medium"
  ): KanbanTask {
    const all = getAll();

    const existing = all.find(
      (t) => t.applicationId === app.applicationId
    );

    if (existing) return existing;

    const task: KanbanTask = {
      id: generateId(),
      applicationId: app.applicationId,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      companyName: app.companyName,
      studentName: app.studentName,
      studentId: app.studentId,
      businessId: app.businessId,
      stage: "Pending",
      priority,
      dueDate: daysFromNow(app.estimatedDeliveryDays),
      proposedBudget: app.proposedBudget,
      estimatedDeliveryDays: app.estimatedDeliveryDays,
      progress: 0,
      tags: [],
      activityLog: [
        {
          id: activityId(),
          type: "created",
          message: "Task created from accepted application",
          timestamp: new Date().toISOString(),
          actorName: app.companyName,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveAll([task, ...all]);

    return task;
  },

  seedMockTasks(businessId: string, studentId: string): void {
    const all = getAll();

    if (all.length > 0) return;

    const tasks: KanbanTask[] = [
      {
        id: "ktask_mock_1",
        applicationId: "app_mock_1",
        jobId: "job_mock_1",
        jobTitle: "Frontend Dashboard",
        companyName: "Company Alpha",
        studentName: "Student One",
        studentId,
        businessId,
        stage: "In Progress",
        priority: "High",
        dueDate: daysFromNow(5),
        proposedBudget: 850,
        estimatedDeliveryDays: 10,
        progress: 45,
        tags: ["React", "UI"],
        activityLog: [
          {
            id: activityId(),
            type: "status_change",
            message: "Moved from Pending → In Progress",
            timestamp: daysAgo(2),
            actorName: "Company Alpha",
          },
          {
            id: activityId(),
            type: "note",
            message: "Progress updated to 45%",
            timestamp: daysAgo(1),
            actorName: "Student One",
          },
          {
            id: activityId(),
            type: "created",
            message: "Task created from accepted application",
            timestamp: daysAgo(3),
            actorName: "Company Alpha",
          },
        ],
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1),
      },
      {
        id: "ktask_mock_2",
        applicationId: "app_mock_2",
        jobId: "job_mock_2",
        jobTitle: "Brand Identity Kit",
        companyName: "Company Beta",
        studentName: "Student Two",
        studentId: "student_beta",
        businessId,
        stage: "Revision",
        priority: "Medium",
        dueDate: daysFromNow(3),
        proposedBudget: 620,
        estimatedDeliveryDays: 8,
        progress: 68,
        tags: ["Design", "Branding"],
        activityLog: [
          {
            id: activityId(),
            type: "status_change",
            message: "Moved from In Progress → Revision",
            timestamp: daysAgo(1),
            actorName: "Company Beta",
          },
          {
            id: activityId(),
            type: "note",
            message: "Requested minor revisions",
            timestamp: daysAgo(1),
            actorName: "Company Beta",
          },
          {
            id: activityId(),
            type: "status_change",
            message: "Moved from Pending → In Progress",
            timestamp: daysAgo(5),
            actorName: "Company Beta",
          },
          {
            id: activityId(),
            type: "created",
            message: "Task created from accepted application",
            timestamp: daysAgo(6),
            actorName: "Company Beta",
          },
        ],
        createdAt: daysAgo(6),
        updatedAt: daysAgo(1),
      },
      {
        id: "ktask_mock_3",
        applicationId: "app_mock_3",
        jobId: "job_mock_3",
        jobTitle: "AI Automation Pipeline",
        companyName: "Company Gamma",
        studentName: "Student Three",
        studentId: "student_gamma",
        businessId,
        stage: "Completed",
        priority: "High",
        dueDate: daysFromNow(1),
        proposedBudget: 1350,
        estimatedDeliveryDays: 18,
        progress: 100,
        tags: ["AI", "Python"],
        activityLog: [
          {
            id: activityId(),
            type: "status_change",
            message: "Moved from Revision → Completed",
            timestamp: daysAgo(1),
            actorName: "Student Three",
          },
          {
            id: activityId(),
            type: "note",
            message: "Deliverables submitted successfully",
            timestamp: daysAgo(1),
            actorName: "Student Three",
          },
          {
            id: activityId(),
            type: "status_change",
            message: "Moved from In Progress → Revision",
            timestamp: daysAgo(3),
            actorName: "Company Gamma",
          },
          {
            id: activityId(),
            type: "created",
            message: "Task created from accepted application",
            timestamp: daysAgo(20),
            actorName: "Company Gamma",
          },
        ],
        createdAt: daysAgo(20),
        updatedAt: daysAgo(1),
      },
      {
        id: "ktask_mock_4",
        applicationId: "app_mock_4",
        jobId: "job_mock_4",
        jobTitle: "Backend Data Pipeline",
        companyName: "Company Delta",
        studentName: "Student Four",
        studentId: "student_delta",
        businessId,
        stage: "Pending",
        priority: "Low",
        dueDate: daysFromNow(22),
        proposedBudget: 1100,
        estimatedDeliveryDays: 25,
        progress: 0,
        tags: ["Backend", "Data"],
        activityLog: [
          {
            id: activityId(),
            type: "created",
            message: "Task created from accepted application",
            timestamp: daysAgo(1),
            actorName: "Company Delta",
          },
        ],
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
      {
        id: "ktask_mock_5",
        applicationId: "app_mock_5",
        jobId: "job_mock_5",
        jobTitle: "Mobile Productivity App",
        companyName: "Company Epsilon",
        studentName: "Student Five",
        studentId: "student_epsilon",
        businessId,
        stage: "Paid",
        priority: "Medium",
        dueDate: daysFromNow(-5),
        proposedBudget: 1200,
        estimatedDeliveryDays: 30,
        progress: 100,
        tags: ["Mobile", "App"],
        activityLog: [
          {
            id: activityId(),
            type: "status_change",
            message: "Moved from Completed → Paid",
            timestamp: daysAgo(2),
            actorName: "Company Epsilon",
          },
          {
            id: activityId(),
            type: "note",
            message: "Payment released successfully",
            timestamp: daysAgo(2),
            actorName: "Company Epsilon",
          },
          {
            id: activityId(),
            type: "created",
            message: "Task created from accepted application",
            timestamp: daysAgo(35),
            actorName: "Company Epsilon",
          },
        ],
        createdAt: daysAgo(35),
        updatedAt: daysAgo(2),
      },
      {
        id: "ktask_mock_6",
        applicationId: "app_mock_6",
        jobId: "job_mock_6",
        jobTitle: "Technical Content Writing",
        companyName: "Company Zeta",
        studentName: "Student Six",
        studentId: "student_zeta",
        businessId,
        stage: "In Progress",
        priority: "Low",
        dueDate: daysFromNow(18),
        proposedBudget: 480,
        estimatedDeliveryDays: 30,
        progress: 20,
        tags: ["Writing", "Tech"],
        activityLog: [
          {
            id: activityId(),
            type: "status_change",
            message: "Moved from Pending → In Progress",
            timestamp: daysAgo(3),
            actorName: "Company Zeta",
          },
          {
            id: activityId(),
            type: "created",
            message: "Task created from accepted application",
            timestamp: daysAgo(5),
            actorName: "Company Zeta",
          },
        ],
        createdAt: daysAgo(5),
        updatedAt: daysAgo(3),
      },
    ];

    saveAll(tasks);
  },

  clearAll(): void {
    saveAll([]);
  },
};