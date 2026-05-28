import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Workflow,
  WorkflowColumn,
  WorkflowTask,
  WorkflowActivity,
  TaskStatus,
} from "@/types/workflow";
import { Application } from "@/types/application";
import { notificationService } from "@/lib/notification-service";
import { trustService } from "@/lib/trust/trust-service";
import { canCreateTask, canEditTask, canTransitionTaskStatus } from "./collaboration/permission-policy";

const DEFAULT_COLUMNS = ["Execution Work", "Deliverables", "Review/Revisions", "Completed Work"];

export const workflowService = {
  /**
   * Creates a full workflow workspace from an accepted application.
   * Auto-provisions columns and an initial kickoff task, or onboarding tasks if requested.
   */
  async createWorkflowFromApplication(app: Application, isOnboardingSeeded: boolean = false): Promise<string> {
    const batch = writeBatch(db!);
    const workflowId = `wf_${app.applicationId}`;
    
    const workflowRef = doc(db!, "workflows", workflowId);
    
    // 1. Create Workflow
    const newWorkflow: Workflow = {
      workflowId,
      jobId: app.jobId,
      applicationId: app.applicationId,
      studentId: app.studentId,
      businessId: app.businessId,
      status: "Pending",
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jobTitle: app.jobTitle,
      studentName: app.studentName,
      businessName: app.companyName,
    };
    batch.set(workflowRef, newWorkflow);

    // 2. Create Columns
    const columnRefs = DEFAULT_COLUMNS.map((colName, index) => {
      const colId = `col_${workflowId}_${index}`;
      const colRef = doc(db!, "workflowColumns", colId);
      const newCol: WorkflowColumn = {
        columnId: colId,
        workflowId,
        name: colName,
        order: index,
        studentId: app.studentId,
        businessId: app.businessId,
        createdAt: new Date().toISOString(),
      };
      batch.set(colRef, newCol);
      return colId;
    });

    const todoColumnId = columnRefs[0];

    // 3. Create Kickoff / Onboarding Tasks
    if (isOnboardingSeeded) {
      const onboardingTasks = [
        { title: "Define deliverables", desc: "Collaborate to finalize the exact project deliverables." },
        { title: "Upload references", desc: "Upload brand assets, API keys, or reference materials." },
        { title: "Confirm timeline", desc: "Set hard deadlines for each phase." },
        { title: "Setup milestone structure", desc: "Agree on escrow milestones and payment splits." }
      ];

      onboardingTasks.forEach((taskData, index) => {
        const taskId = `task_${Date.now()}_onboard_${index}`;
        const taskRef = doc(db!, "workflowTasks", taskId);
        batch.set(taskRef, {
          taskId,
          workflowId,
          columnId: todoColumnId,
          title: taskData.title,
          description: taskData.desc,
          priority: "High",
          assigneeId: app.studentId,
          attachments: [],
          aiSuggestions: [],
          status: "pending" as TaskStatus,
          studentId: app.studentId,
          businessId: app.businessId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "system",
          ownerId: app.studentId,
          ownerRole: "student",
          assignedTo: app.studentId,
          assignedRole: "student",
          taskType: "execution",
        });
      });
    } else {
      const taskId = `task_${Date.now()}_kickoff`;
      const taskRef = doc(db!, "workflowTasks", taskId);
      const newTask: WorkflowTask = {
        taskId,
        workflowId,
        columnId: todoColumnId,
        title: "Project Kickoff & Requirements Review",
        description: "Review the initial job requirements and set up milestones.",
        priority: "High",
        assigneeId: app.studentId,
        attachments: [],
        aiSuggestions: [],
        status: "pending" as TaskStatus,
        studentId: app.studentId,
        businessId: app.businessId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system",
        ownerId: app.studentId,
        ownerRole: "student",
        assignedTo: app.studentId,
        assignedRole: "student",
        taskType: "execution",
      };
      batch.set(taskRef, newTask);
    }

    // 4. Log Creation Activity
    const activityId = `act_${Date.now()}`;
    const activityRef = doc(db!, "workflowActivity", activityId);
    const newActivity: WorkflowActivity = {
      activityId,
      workflowId,
      type: "workflow_created",
      message: "Workspace automatically provisioned from accepted application.",
      actorId: app.businessId,
      actorName: app.companyName,
      studentId: app.studentId,
      businessId: app.businessId,
      createdAt: new Date().toISOString(),
    };
    batch.set(activityRef, newActivity);

    await batch.commit();
    return workflowId;
  },

  /**
   * Listen to all active workflows for a specific user (student or business).
   */
  subscribeToUserWorkflows(
    userId: string,
    role: "student" | "business",
    onUpdate: (workflows: Workflow[]) => void
  ) {
    const q = query(
      collection(db!, "workflows"),
      where(role === "student" ? "studentId" : "businessId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const results: Workflow[] = [];
      snapshot.forEach((docSnap) => results.push(docSnap.data() as Workflow));
      // Sort in memory by updatedAt descending
      results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      onUpdate(results);
    });
  },

  /**
   * Fetch a single workflow by ID.
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    const docSnap = await getDoc(doc(db!, "workflows", workflowId));
    return docSnap.exists() ? (docSnap.data() as Workflow) : null;
  },

  /**
   * Listen to columns for a workflow.
   */
  subscribeToColumns(workflowId: string, onUpdate: (columns: WorkflowColumn[]) => void) {
    const q = query(
      collection(db!, "workflowColumns"),
      where("workflowId", "==", workflowId),
      orderBy("order", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const results: WorkflowColumn[] = [];
      snapshot.forEach((docSnap) => results.push(docSnap.data() as WorkflowColumn));
      onUpdate(results);
    });
  },

  /**
   * Listen to tasks for a workflow.
   */
  subscribeToTasks(workflowId: string, onUpdate: (tasks: WorkflowTask[]) => void) {
    const q = query(
      collection(db!, "workflowTasks"),
      where("workflowId", "==", workflowId)
    );
    return onSnapshot(q, (snapshot) => {
      const results: WorkflowTask[] = [];
      snapshot.forEach((docSnap) => results.push(docSnap.data() as WorkflowTask));
      onUpdate(results);
    });
  },

  /**
   * Listen to activity feed.
   */
  subscribeToActivity(workflowId: string, onUpdate: (activities: WorkflowActivity[]) => void) {
    const q = query(
      collection(db!, "workflowActivity"),
      where("workflowId", "==", workflowId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const results: WorkflowActivity[] = [];
      snapshot.forEach((docSnap) => results.push(docSnap.data() as WorkflowActivity));
      onUpdate(results);
    });
  },

  /**
   * Move a task to a new column. Logs the activity automatically.
   */
  async moveTask(
    workflowId: string,
    taskId: string,
    newColumnId: string,
    newColumnName: string,
    actorId: string,
    actorName: string,
    studentId: string,
    businessId: string
  ) {
    const taskRef = doc(db!, "workflowTasks", taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) throw new Error("Task not found.");
    const taskData = taskSnap.data() as WorkflowTask;

    const { collaborationService } = await import("./collaboration-service");
    const collab = await collaborationService.getCollaborationByWorkflowId(workflowId);
    if (!collab) throw new Error("Collaboration not found.");

    const actorRole = actorId === studentId ? "student" : "business";

    // Map columns to target statuses
    let targetStatus: TaskStatus;
    if (newColumnName === "Execution Work") {
      targetStatus = "in_progress";
    } else if (newColumnName === "Deliverables") {
      targetStatus = "submitted";
    } else if (newColumnName === "Review/Revisions") {
      targetStatus = "revision_requested";
    } else if (newColumnName === "Completed Work") {
      targetStatus = "approved";
    } else {
      // Fallbacks
      if (newColumnName === "Pending") targetStatus = "pending";
      else if (newColumnName === "In Progress") targetStatus = "in_progress";
      else if (newColumnName === "Revision") targetStatus = "revision_requested";
      else if (newColumnName === "Completed" || newColumnName === "Paid") targetStatus = "approved";
      else throw new Error(`Invalid column name: '${newColumnName}'`);
    }

    if (!canTransitionTaskStatus(actorId, actorRole, collab.status, taskData, targetStatus)) {
      throw new Error(`Permission denied: Cannot transition task status to '${targetStatus}' as a '${actorRole}'.`);
    }

    const batch = writeBatch(db!);
    batch.update(taskRef, {
      columnId: newColumnId,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    });

    if (targetStatus === "in_progress") {
      const workflowRef = doc(db!, "workflows", workflowId);
      batch.update(workflowRef, {
        status: "In Progress",
        updatedAt: new Date().toISOString(),
      });
    }

    const activityId = `act_${Date.now()}`;
    const activityRef = doc(db!, "workflowActivity", activityId);
    batch.set(activityRef, {
      activityId,
      workflowId,
      taskId,
      type: "task_moved",
      message: `Moved task to ${newColumnName} (Status: ${targetStatus})`,
      actorId,
      actorName,
      studentId,
      businessId,
      createdAt: new Date().toISOString(),
    });

    await batch.commit();

    // Trigger notification to the OTHER user
    const recipientId = actorId === studentId ? businessId : studentId;
    await notificationService.createNotification({
      userId: recipientId,
      type: "workflow",
      title: "Task Moved",
      description: `${actorName} transitioned task to status ${targetStatus}`,
      relatedEntityId: workflowId,
      relatedEntityType: "workflow",
      actionUrl: `/workflows/${workflowId}`
    });

    // Trust Intelligence Logging
    if (targetStatus === "approved") {
      const studentImpact = actorId === studentId ? 2 : 1; // Student delivering gets +2
      await trustService.logTrustEvent(
        studentId,
        "student",
        "delivery",
        studentImpact,
        "Completed a workflow task",
        taskId,
        "task"
      );
    } else if (targetStatus === "submitted" || targetStatus === "revision_requested") {
      await trustService.logTrustEvent(
        studentId,
        "student",
        "collaboration",
        1,
        targetStatus === "submitted" ? "Submitted a deliverable for review" : "Requested revision on task",
        taskId,
        "task"
      );
    }
  },

  /**
   * Add a new task.
   */
  async addTask(task: Omit<WorkflowTask, "taskId" | "createdAt" | "updatedAt">) {
    const { collaborationService } = await import("./collaboration-service");
    const collab = await collaborationService.getCollaborationByWorkflowId(task.workflowId);
    if (!collab) throw new Error("Collaboration not found.");

    const actorRole = task.createdBy === task.studentId ? "student" : "business";
    if (!canCreateTask(actorRole, collab.status, task.taskType)) {
      throw new Error(`Permission denied: Cannot create task of type '${task.taskType}' as a '${actorRole}' in status '${collab.status}'.`);
    }

    const taskId = `task_${Date.now()}`;
    const taskRef = doc(db!, "workflowTasks", taskId);
    
    await setDoc(taskRef, {
      ...task,
      taskId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Update an existing task.
   */
  async updateTask(taskId: string, updates: Partial<WorkflowTask>, actorId?: string, actorRole?: "student" | "business") {
    const taskRef = doc(db!, "workflowTasks", taskId);
    
    if (actorId && actorRole) {
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) throw new Error("Task not found.");
      const currentTask = taskSnap.data() as WorkflowTask;
      if (!canEditTask(actorId, actorRole, currentTask)) {
        throw new Error("Permission denied: You are not authorized to edit this task.");
      }
    }

    await updateDoc(taskRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Log custom activity (e.g., attachment uploaded).
   */
  async logActivity(activity: Omit<WorkflowActivity, "activityId" | "createdAt">) {
    const activityId = `act_${Date.now()}`;
    const activityRef = doc(db!, "workflowActivity", activityId);
    await setDoc(activityRef, {
      ...activity,
      activityId,
      createdAt: new Date().toISOString(),
    });

    // Determine if it's an attachment upload to trigger a specific notification
    if (activity.type === "attachment_uploaded") {
      const recipientId = activity.actorId === activity.studentId ? activity.businessId : activity.studentId;
      await notificationService.createNotification({
        userId: recipientId,
        type: "success",
        title: "New File Uploaded",
        description: activity.message,
        relatedEntityId: activity.workflowId,
        relatedEntityType: "workflow",
        actionUrl: `/workflows/${activity.workflowId}`
      });
    }
  },

  /**
   * Update workflow status directly
   */
  async updateWorkflowStatus(workflowId: string, status: Workflow["status"]) {
    if (!db) throw new Error("Firestore is not initialized.");
    const workflowRef = doc(db, "workflows", workflowId);
    await updateDoc(workflowRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  }
};
