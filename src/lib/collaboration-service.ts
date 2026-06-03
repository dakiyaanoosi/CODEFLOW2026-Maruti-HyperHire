import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { generateId } from "@/lib/id-utils";
import {
  Collaboration,
  CollaborationStatus,
  CollaborationActivityEvent,
  CollaborationActivityAction,
  ProvisionCollaborationParams,
  VALID_TRANSITIONS,
  TRANSITION_OWNERSHIP,
  TransitionActor,
} from "@/types/collaboration";
import { messageService } from "@/lib/message-service";
import { notificationService } from "@/lib/notification-service";

const COLLECTION_NAME = "collaborations";
const ACTIVITY_COLLECTION = "collaborationActivity";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

// ─── Core Service ────────────────────────────────────────────────────────────

export const collaborationService = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRANSITION ENGINE — The ONLY valid way to mutate collaboration status
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async transitionCollaboration(
    collaborationId: string,
    toStatus: CollaborationStatus,
    actorId: string,
    actorRole: "student" | "business",
    metadata?: { message?: string; note?: string }
  ): Promise<Collaboration> {
    if (!db) throw new Error("Firestore is not initialized.");

    const collab = await this.getCollaboration(collaborationId);
    if (!collab) throw new Error("Collaboration not found.");

    const fromStatus = collab.status;

    // 1. Validate transition is legal
    const validTargets = VALID_TRANSITIONS[fromStatus];
    if (!validTargets || !validTargets.includes(toStatus)) {
      throw new Error(
        `Invalid transition: cannot move from "${fromStatus}" to "${toStatus}".`
      );
    }

    // 2. Validate actor role ownership
    const transitionKey = `${fromStatus}→${toStatus}`;
    const requiredActor: TransitionActor = TRANSITION_OWNERSHIP[transitionKey] || "system";

    if (requiredActor !== "either" && requiredActor !== "system" && requiredActor !== actorRole) {
      throw new Error(
        `Unauthorized transition: "${transitionKey}" requires "${requiredActor}" role, but actor has "${actorRole}".`
      );
    }

    // 3. Validate actor is a participant
    if (actorId !== collab.businessId && actorId !== collab.studentId) {
      throw new Error("Actor is not a participant of this collaboration.");
    }

    // 4. Build update payload
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: toStatus,
      updatedAt: now,
    };

    if (toStatus === "active" && !collab.startedAt) {
      updatePayload.startedAt = now;
    }

    if (toStatus === "completed") {
      updatePayload.completedAt = now;
    }

    if (toStatus === "scope_review" || toStatus === "awaiting_funding" || toStatus === "active") {
      updatePayload.agreementLocked = true;
    }

    // 5. Commit the transition
    const collabRef = doc(db, COLLECTION_NAME, collaborationId);
    await updateDoc(collabRef, updatePayload);

    // 6. Log activity event
    const actionMap: Partial<Record<string, CollaborationActivityAction>> = {
      "setup_pending→scope_review": "scope_accepted",
      "scope_review→awaiting_funding": "scope_approved",
      "awaiting_funding→active": "escrow_funded",
      "active→in_review": "milestone_submitted",
      "in_review→revision_requested": "revision_requested",
      "revision_requested→in_review": "milestone_submitted",  // Review loop resubmission
      "in_review→completed": "payment_released",              // System-only via escrow release
    };

    const action = actionMap[transitionKey] || "status_transitioned";
    const defaultMessage = `Collaboration transitioned from "${fromStatus}" to "${toStatus}"`;

    await this.logActivity({
      collaborationId,
      actorId,
      actorRole,
      entityType: "collaboration",
      entityId: collaborationId,
      action,
      fromState: fromStatus,
      toState: toStatus,
      message: metadata?.message || defaultMessage,
      metadata: metadata?.note ? { note: metadata.note } : undefined,
    });

    // Send a system message in the chat
    try {
      await messageService.sendSystemMessage(
        collab.conversationId,
        collaborationId,
        metadata?.message || defaultMessage,
        "general"
      );
    } catch (e) {
      console.error("Error sending status transition system message:", e);
    }

    // 7. Trigger notifications
    const recipientId = actorId === collab.businessId ? collab.studentId : collab.businessId;
    const actorName = actorId === collab.businessId ? collab.businessName : collab.studentName;

    const notifMap: Partial<Record<CollaborationStatus, { title: string; desc: string; type: "success" | "warning" | "info" }>> = {
      scope_review: {
        title: "Scope Accepted",
        desc: `${actorName} accepted the scope for "${collab.title}".`,
        type: "info",
      },
      awaiting_funding: {
        title: "Scope Approved!",
        desc: `${actorName} approved the scope for "${collab.title}". Awaiting funding.`,
        type: "success",
      },
      active: {
        title: "Collaboration Active! 🚀",
        desc: `"${collab.title}" is now active. Work can begin.`,
        type: "success",
      },
      in_review: {
        title: "Deliverable Submitted",
        desc: `${actorName} submitted deliverables for "${collab.title}" for review.`,
        type: "success",
      },
      revision_requested: {
        title: "Revision Requested ⚠️",
        desc: `${actorName} requested a revision on "${collab.title}".`,
        type: "warning",
      },
      completed: {
        title: "Project Completed! 🎉",
        desc: `"${collab.title}" has been completed. Payment released.`,
        type: "success",
      },
      cancelled: {
        title: "Collaboration Cancelled",
        desc: `"${collab.title}" has been cancelled by ${actorName}.`,
        type: "warning",
      },
    };

    const notif = notifMap[toStatus];
    if (notif) {
      await notificationService.createNotification({
        userId: recipientId,
        type: notif.type,
        title: notif.title,
        description: notif.desc,
        relatedEntityId: collaborationId,
        relatedEntityType: "collaboration" as any,
        actionUrl: `/workflows/${collab.workflowId}`,
      });
    }

    // Return updated collaboration
    return {
      ...collab,
      ...updatePayload,
      status: toStatus,
    } as Collaboration;
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROVISIONING — Atomic bootstrap pipeline (ALL OR NOTHING)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async provisionCollaboration(
    params: ProvisionCollaborationParams
  ): Promise<Collaboration> {
    if (!db) throw new Error("Firestore is not initialized.");

    const { writeBatch, Timestamp } = await import("firebase/firestore");
    const batch = writeBatch(db);

    const collaborationId = generateId("collab");
    const now = new Date().toISOString();
    const firestoreNow = Timestamp.now();
    const applicationId = params.applicationId || `synth_${collaborationId}`;
    const workflowId = `wf_${applicationId}`;
    const conversationId = generateId("conv");
    const escrowId = `esc_${applicationId}`;

    // ── 1. Workflow + Columns + Kickoff Tasks ──────────────────────────────

    const workflowRef = doc(db, "workflows", workflowId);
    batch.set(workflowRef, {
      workflowId,
      jobId: params.jobId,
      applicationId,
      studentId: params.studentId,
      businessId: params.businessId,
      status: "Pending",
      progress: 0,
      createdAt: now,
      updatedAt: now,
      jobTitle: params.jobTitle,
      studentName: params.studentName,
      businessName: params.businessName,
    });

    const DEFAULT_COLUMNS = ["Execution Work", "Deliverables", "Review/Revisions", "Completed Work"];
    const columnIds = DEFAULT_COLUMNS.map((colName, index) => {
      const colId = `col_${workflowId}_${index}`;
      batch.set(doc(db!, "workflowColumns", colId), {
        columnId: colId,
        workflowId,
        name: colName,
        order: index,
        studentId: params.studentId,
        businessId: params.businessId,
        createdAt: now,
      });
      return colId;
    });

    const todoColumnId = columnIds[0];
    const firstMilestoneId = `ms_${collaborationId}_0`;

    if (params.isOnboardingSeeded) {
      const onboardingTasks = [
        { title: "Define deliverables", desc: "Collaborate to finalize the exact project deliverables." },
        { title: "Upload references", desc: "Upload brand assets, API keys, or reference materials." },
        { title: "Confirm timeline", desc: "Set hard deadlines for each phase." },
        { title: "Setup milestone structure", desc: "Agree on escrow milestones and payment splits." },
      ];
      onboardingTasks.forEach((taskData, index) => {
        const taskId = `task_${Date.now()}_onboard_${index}`;
        batch.set(doc(db!, "workflowTasks", taskId), {
          taskId,
          workflowId,
          columnId: todoColumnId,
          milestoneId: firstMilestoneId,
          title: taskData.title,
          description: taskData.desc,
          priority: "High",
          assigneeId: params.studentId,
          attachments: [],
          aiSuggestions: [],
          status: "pending",
          studentId: params.studentId,
          businessId: params.businessId,
          createdAt: now,
          updatedAt: now,
          createdBy: "system",
          ownerId: params.studentId,
          ownerRole: "student",
          assignedTo: params.studentId,
          assignedRole: "student",
          taskType: "execution",
        });
      });
    } else {
      const taskId = `task_${Date.now()}_kickoff`;
      batch.set(doc(db!, "workflowTasks", taskId), {
        taskId,
        workflowId,
        columnId: todoColumnId,
        milestoneId: firstMilestoneId,
        title: "Project Kickoff & Requirements Review",
        description: "Review the initial job requirements and set up milestones.",
        priority: "High",
        assigneeId: params.studentId,
        attachments: [],
        aiSuggestions: [],
        status: "pending",
        studentId: params.studentId,
        businessId: params.businessId,
        createdAt: now,
        updatedAt: now,
        createdBy: "system",
        ownerId: params.studentId,
        ownerRole: "student",
        assignedTo: params.studentId,
        assignedRole: "student",
        taskType: "execution",
      });
    }

    // Workflow creation activity
    const wfActivityId = `act_${Date.now()}`;
    batch.set(doc(db!, "workflowActivity", wfActivityId), {
      activityId: wfActivityId,
      workflowId,
      type: "workflow_created",
      message: "Workspace automatically provisioned from accepted application.",
      actorId: params.businessId,
      actorName: params.businessName,
      studentId: params.studentId,
      businessId: params.businessId,
      createdAt: now,
    });

    // ── 2. Conversation + System Message ────────────────────────────────────

    const { getInitials } = await import("@/lib/message-utils");
    const conversationData = cleanUndefined({
      conversationId,
      participantIds: [params.studentId, params.businessId],
      participantRoles: {
        [params.studentId]: "student",
        [params.businessId]: "business",
      },
      participantNames: {
        [params.studentId]: params.studentName,
        [params.businessId]: params.businessName,
      },
      participantInitials: {
        [params.studentId]: getInitials(params.studentName),
        [params.businessId]: getInitials(params.businessName),
      },
      relatedJobId: params.jobId,
      relatedApplicationId: applicationId,
      collaborationId,
      lastMessage: "Collaboration started! You can now start communicating.",
      lastMessageAt: now,
      unreadCounts: {
        [params.studentId]: 1,
        [params.businessId]: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
    batch.set(doc(db!, "conversations", conversationId), conversationData);

    const sysMsgId = generateId("msg");
    batch.set(doc(db!, "conversations", conversationId, "messages", sysMsgId), {
      messageId: sysMsgId,
      conversationId,
      collaborationId,
      senderId: "system",
      senderRole: "business",
      content: "Collaboration started! You can now start communicating.",
      messageType: "system",
      readBy: [],
      createdAt: now,
    });

    // ── 3. Escrow ───────────────────────────────────────────────────────────

    const amount = params.proposedBudget || 100;
    const platformFee = Math.round(amount * 0.1);
    const payoutAmount = amount - platformFee;

    batch.set(doc(db!, "escrows", escrowId), cleanUndefined({
      escrowId,
      workflowId,
      collaborationId,
      applicationId,
      jobId: params.jobId,
      businessId: params.businessId,
      studentId: params.studentId,
      amount,
      platformFee,
      payoutAmount,
      status: "pending_funding",
      createdAt: firestoreNow,
      updatedAt: firestoreNow,
      jobTitle: params.jobTitle,
      businessName: params.businessName,
      studentName: params.studentName,
      timeline: [
        { type: "created", timestamp: firestoreNow, note: "Escrow contract setup. Awaiting business client funding." },
      ],
    }) as any);

    // ── 4. Default Milestones ───────────────────────────────────────────────

    const milestoneDefaults = [
      { title: "Project Kickoff & Setup", desc: "Define project objectives, timeline, and kickoff requirements.", order: 0, status: "active" },
      { title: "Core Development & Implementation", desc: "Build out the primary execution deliverables.", order: 1, status: "pending" },
      { title: "Final Handover & Review", desc: "Complete all final review items and deliver assets to client.", order: 2, status: "pending" },
    ];
    milestoneDefaults.forEach((def) => {
      const msId = `ms_${collaborationId}_${def.order}`;
      batch.set(doc(db!, "milestones", msId), {
        milestoneId: msId,
        collaborationId,
        title: def.title,
        description: def.desc,
        status: def.status,
        progress: 0,
        order: def.order,
        createdBy: params.businessId,
        createdAt: firestoreNow,
        updatedAt: firestoreNow,
        eligibleForRelease: false,
      });
    });

    // ── 5. Collaboration Document ───────────────────────────────────────────

    const initialStatus: CollaborationStatus = "awaiting_funding";

    const collaboration: Collaboration = {
      collaborationId,
      applicationId: params.applicationId,
      invitationId: params.invitationId,
      businessId: params.businessId,
      studentId: params.studentId,
      title: params.jobTitle,
      description: `Collaboration for "${params.jobTitle}"`,
      status: initialStatus,
      workflowId,
      conversationId,
      escrowId,
      agreementLocked: true,
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      businessName: params.businessName,
      studentName: params.studentName,
      studentAvatar: params.studentAvatar,
      agreedBudget: params.proposedBudget,
    };

    batch.set(doc(db!, "collaborations", collaborationId), cleanUndefined(collaboration as any));

    // ── 6. Workflow ↔ Collaboration Linkage ─────────────────────────────────

    batch.update(workflowRef, { collaborationId });

    // ── 7. Activity Bootstrap ───────────────────────────────────────────────

    const bootstrapEventId = generateId("cact");
    batch.set(doc(db!, "collaborationActivity", bootstrapEventId), {
      eventId: bootstrapEventId,
      collaborationId,
      actorId: params.businessId,
      actorRole: "system",
      entityType: "collaboration",
      entityId: collaborationId,
      action: "collaboration_created",
      toState: initialStatus,
      message: `Collaboration provisioned for "${params.jobTitle}" between ${params.businessName} and ${params.studentName}.`,
      timestamp: now,
    });

    // ── 8. ATOMIC COMMIT — ALL OR NOTHING ───────────────────────────────────

    await batch.commit();

    // ── Post-commit: Non-critical side effects ──────────────────────────────

    try {
      await notificationService.createNotification({
        userId: params.businessId,
        type: "info",
        title: "Escrow Funding Required 💳",
        description: `Please fund the escrow for "${params.jobTitle}" to initiate execution.`,
        relatedEntityId: escrowId,
        relatedEntityType: "escrow",
        actionUrl: "/escrow",
      });
    } catch (e) {
      console.error("[Collaboration Service] Error sending escrow notification:", e);
    }

    return collaboration;
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ORCHESTRATION WRAPPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async createCollaborationFromApplication(
    app: {
      applicationId: string;
      jobId: string;
      jobTitle: string;
      businessId: string;
      studentId: string;
      studentName: string;
      companyName: string;
      proposedBudget: number;
      studentAvatar?: string;
    }
  ): Promise<Collaboration> {
    return this.provisionCollaboration({
      applicationId: app.applicationId,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      businessId: app.businessId,
      businessName: app.companyName,
      studentId: app.studentId,
      studentName: app.studentName,
      studentAvatar: app.studentAvatar,
      proposedBudget: app.proposedBudget,
      isOnboardingSeeded: false,
    });
  },

  async createCollaborationFromInvitation(
    invite: {
      invitationId: string;
      jobId: string;
      jobTitle: string;
      businessId: string;
      businessName: string;
      studentId: string;
    },
    studentName: string,
    studentAvatar?: string,
    acceptanceNote?: string
  ): Promise<Collaboration> {
    const collab = await this.provisionCollaboration({
      invitationId: invite.invitationId,
      jobId: invite.jobId,
      jobTitle: invite.jobTitle,
      businessId: invite.businessId,
      businessName: invite.businessName,
      studentId: invite.studentId,
      studentName,
      studentAvatar,
      proposedBudget: 0,
      isOnboardingSeeded: true,
    });

    // Send acceptance note as first message if provided
    if (acceptanceNote) {
      try {
        await messageService.sendMessage(
          collab.conversationId,
          invite.studentId,
          "student",
          acceptanceNote
        );
      } catch (e) {
        console.error("[Collaboration Service] Error sending acceptance note:", e);
      }
    }

    return collab;
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // QUERIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async getCollaboration(collaborationId: string): Promise<Collaboration | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, COLLECTION_NAME, collaborationId));
    return snap.exists() ? (snap.data() as Collaboration) : null;
  },

  async getCollaborationByWorkflowId(workflowId: string): Promise<Collaboration | null> {
    if (!db) return null;
    const q = query(
      collection(db, COLLECTION_NAME),
      where("workflowId", "==", workflowId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Collaboration;
  },

  async getCollaborationByEscrowId(escrowId: string): Promise<Collaboration | null> {
    if (!db) return null;
    const q = query(
      collection(db, COLLECTION_NAME),
      where("escrowId", "==", escrowId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Collaboration;
  },

  subscribeToCollaboration(
    collaborationId: string,
    onUpdate: (collab: Collaboration | null) => void
  ) {
    if (!db) return () => {};
    return onSnapshot(doc(db, COLLECTION_NAME, collaborationId), (snap) => {
      onUpdate(snap.exists() ? (snap.data() as Collaboration) : null);
    });
  },

  subscribeToUserCollaborations(
    userId: string,
    role: "student" | "business",
    onUpdate: (collaborations: Collaboration[]) => void
  ) {
    if (!db) return () => {};
    const q = query(
      collection(db, COLLECTION_NAME),
      where(role === "student" ? "studentId" : "businessId", "==", userId)
    );
    return onSnapshot(q, (snapshot) => {
      const results: Collaboration[] = [];
      snapshot.forEach((docSnap) => results.push(docSnap.data() as Collaboration));
      results.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      onUpdate(results);
    });
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ACTIVITY LOGGING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async logActivity(
    event: Omit<CollaborationActivityEvent, "eventId" | "timestamp">
  ): Promise<void> {
    if (!db) return;

    const eventId = generateId("cact");
    const activityRef = doc(db, ACTIVITY_COLLECTION, eventId);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const cleanUndefined = (obj: any): any => {
      if (obj === undefined) return undefined;
      if (obj === null) return null;
      if (Array.isArray(obj)) {
        return obj.map(cleanUndefined).filter((v) => v !== undefined);
      }
      if (typeof obj === "object") {
        if (
          obj.constructor &&
          obj.constructor.name !== "Object" &&
          obj.constructor.name !== "Array"
        ) {
          return obj;
        }
        const clean: any = {};
        Object.keys(obj).forEach((key) => {
          const val = obj[key];
          const cleaned = cleanUndefined(val);
          if (cleaned !== undefined) {
            clean[key] = cleaned;
          }
        });
        return clean;
      }
      return obj;
    };

    const cleanEvent = cleanUndefined(event);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    await setDoc(activityRef, {
      ...cleanEvent,
      eventId,
      timestamp: new Date().toISOString(),
    });
  },

  subscribeToCollaborationActivity(
    collaborationId: string,
    onUpdate: (events: CollaborationActivityEvent[]) => void
  ) {
    if (!db) return () => {};
    const q = query(
      collection(db, ACTIVITY_COLLECTION),
      where("collaborationId", "==", collaborationId)
    );
    return onSnapshot(q, (snapshot) => {
      const results: CollaborationActivityEvent[] = [];
      snapshot.forEach((docSnap) =>
        results.push(docSnap.data() as CollaborationActivityEvent)
      );
      results.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      onUpdate(results);
    });
  },
};
