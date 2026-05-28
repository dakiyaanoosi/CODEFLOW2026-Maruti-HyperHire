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
  writeBatch,
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
import { workflowService } from "@/lib/workflow-service";
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
      "active→in_review": "deliverable_submitted",
      "in_review→revision_requested": "revision_requested",
      "revision_requested→active": "deliverable_submitted",
      "in_review→completed": "deliverable_approved",
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
  // PROVISIONING — Single canonical bootstrap pipeline
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async provisionCollaboration(
    params: ProvisionCollaborationParams
  ): Promise<Collaboration> {
    if (!db) throw new Error("Firestore is not initialized.");

    const collaborationId = generateId("collab");
    const now = new Date().toISOString();

    // 1. Create workflow board
    const workflowId = await workflowService.createWorkflowFromApplication(
      {
        applicationId: params.applicationId || `synth_${collaborationId}`,
        jobId: params.jobId,
        jobTitle: params.jobTitle,
        businessId: params.businessId,
        studentId: params.studentId,
        studentName: params.studentName,
        companyName: params.businessName,
        // Required fields from Application that we fill with defaults
        coverLetter: "",
        proposalText: "",
        estimatedDeliveryDays: 14,
        proposedBudget: params.proposedBudget || 0,
        status: "accepted" as any,
        createdAt: now,
        updatedAt: now,
      },
      params.isOnboardingSeeded || false
    );

    // 2. Create conversation
    const conversation = await messageService.createConversationFromApplication(
      {
        applicationId: params.applicationId || `synth_${collaborationId}`,
        jobId: params.jobId,
        jobTitle: params.jobTitle,
        businessId: params.businessId,
        studentId: params.studentId,
        studentName: params.studentName,
        companyName: params.businessName,
        coverLetter: "",
        proposalText: "",
        estimatedDeliveryDays: 14,
        proposedBudget: params.proposedBudget || 0,
        status: "accepted" as any,
        createdAt: now,
        updatedAt: now,
      },
      collaborationId
    );

    // 3. Create escrow
    let escrowId: string | undefined;
    try {
      const { escrowService } = await import("@/lib/escrow-service");
      const escrow = await escrowService.createEscrowFromAcceptedApplication(
        {
          applicationId: params.applicationId || `synth_${collaborationId}`,
          jobId: params.jobId,
          jobTitle: params.jobTitle,
          businessId: params.businessId,
          studentId: params.studentId,
          studentName: params.studentName,
          companyName: params.businessName,
          coverLetter: "",
          proposalText: "",
          estimatedDeliveryDays: 14,
          proposedBudget: params.proposedBudget || 0,
          status: "accepted" as any,
          createdAt: now,
          updatedAt: now,
        },
        workflowId,
        collaborationId
      );
      escrowId = escrow.escrowId;
    } catch (e) {
      console.error("[Collaboration Service] Error creating escrow during provisioning:", e);
    }

    // 4. Auto-advance status: setup_pending → scope_review → awaiting_funding → active
    // (Auto-funding mode — collaborations start at "active" immediately)
    const initialStatus: CollaborationStatus = "active";

    // 5. Create collaboration document
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
      conversationId: conversation.conversationId,
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

    const cleanedCollab = cleanUndefined(collaboration as any) as any;
    await setDoc(doc(db, COLLECTION_NAME, collaborationId), cleanedCollab);

    // 6. Update workflow with collaborationId
    try {
      const workflowRef = doc(db, "workflows", workflowId);
      await updateDoc(workflowRef, { collaborationId });
    } catch (e) {
      console.error("[Collaboration Service] Error linking workflow:", e);
    }

    // 7. Log provisioning activity
    await this.logActivity({
      collaborationId,
      actorId: params.businessId,
      actorRole: "system",
      entityType: "collaboration",
      entityId: collaborationId,
      action: "collaboration_created",
      toState: initialStatus,
      message: `Collaboration provisioned for "${params.jobTitle}" between ${params.businessName} and ${params.studentName}.`,
    });

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

    await setDoc(activityRef, {
      ...event,
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
