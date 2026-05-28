import { db } from "@/lib/firebase";
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
  Timestamp
} from "firebase/firestore";
import type { Escrow, EscrowSummary, EscrowStatus, EscrowEvent } from "@/types/escrow";
import type { Application } from "@/types/application";
import { canSubmitDeliverable, canRequestRevision, canReleaseEscrow } from "./collaboration/permission-policy";
import { messageService } from "@/lib/message-service";

const COLLECTION_NAME = "escrows";

const parseToDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  if (typeof dateVal.toDate === "function") {
    return dateVal.toDate();
  }
  return new Date(dateVal);
};

/**
 * Helper to serialize Firestore document data (converting Timestamps to ISO strings for UI)
 */
function serializeEscrow(data: any, id: string): Escrow {
  return {
    ...data,
    escrowId: id,
    fundedAt: data.fundedAt?.toDate ? data.fundedAt.toDate().toISOString() : data.fundedAt || null,
    releasedAt: data.releasedAt?.toDate ? data.releasedAt.toDate().toISOString() : data.releasedAt || null,
    releaseEligibleAt: data.releaseEligibleAt?.toDate ? data.releaseEligibleAt.toDate().toISOString() : data.releaseEligibleAt || null,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    timeline: (data.timeline || []).map((ev: any) => ({
      ...ev,
      timestamp: ev.timestamp?.toDate ? ev.timestamp.toDate().toISOString() : ev.timestamp,
    })),
  };
}

/**
 * Helper to remove undefined properties before writing to Firestore
 */
function cleanFirestoreData(data: any) {
  const clean: any = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
}

/**
 * Helper to compile summary from a list of escrows
 */
function compileSummary(txns: Escrow[]): EscrowSummary {
  return {
    totalFunded:     txns.filter((t) => t.status !== "pending_funding" && t.status !== "cancelled").reduce((s, t) => s + t.amount, 0),
    totalReleased:   txns.filter((t) => t.status === "released").reduce((s, t) => s + (t.payoutAmount || t.amount * 0.9), 0),
    pendingApproval: txns.filter((t) => t.status === "funded" && t.timeline && t.timeline.length > 0 && t.timeline[t.timeline.length - 1].type === "submitted").length,
    inReview:        txns.filter((t) => t.status === "funded" && t.timeline && t.timeline.length > 0 && t.timeline[t.timeline.length - 1].type === "submitted").length,
    transactions:    txns,
  };
}

export const escrowService = {
  /**
   * Create a new escrow upon application acceptance
   */
  async createEscrowFromAcceptedApplication(app: Application, workflowId: string, collaborationId?: string): Promise<Escrow> {
    if (!db) throw new Error("Firestore is not initialized.");

    const escrowId = `esc_${app.applicationId}`;
    const escrowRef = doc(db, COLLECTION_NAME, escrowId);

    const amount = app.proposedBudget || 100;
    const platformFee = Math.round(amount * 0.1);
    const payoutAmount = amount - platformFee;

    const now = Timestamp.now();
    const newEscrow: any = {
      escrowId,
      workflowId,
      collaborationId: collaborationId || undefined,
      applicationId: app.applicationId,
      jobId: app.jobId,
      businessId: app.businessId,
      studentId: app.studentId,
      amount,
      platformFee,
      payoutAmount,
      status: "pending_funding" as EscrowStatus,
      createdAt: now,
      updatedAt: now,
      jobTitle: app.jobTitle,
      businessName: app.companyName,
      studentName: app.studentName,
      timeline: [
        { type: "created", timestamp: now, note: "Escrow contract setup. Awaiting business client funding." }
      ]
    };

    await setDoc(escrowRef, cleanFirestoreData(newEscrow));

    // Send notification to business about funding pending
    try {
      const { notificationService } = await import("@/lib/notification-service");
      await notificationService.createNotification({
        userId: app.businessId,
        type: "info",
        title: "Escrow Funding Required 💳",
        description: `Please fund the escrow for "${app.jobTitle}" to initiate execution.`,
        relatedEntityId: escrowId,
        relatedEntityType: "escrow",
        actionUrl: "/escrow"
      });
    } catch (e) {
      console.error("Error creating escrow notification:", e);
    }

    return serializeEscrow(newEscrow, escrowId);
  },

  /**
   * Business funds the escrow contract.
   * Transitions escrow to "funded" and unlocks execution.
   */
  async fundEscrow(escrowId: string, actorId: string, actorRole: "student" | "business"): Promise<Escrow> {
    if (!db) throw new Error("Firestore is not initialized.");
    if (actorRole !== "business") {
      throw new Error("Permission denied: Only business clients can fund escrows.");
    }

    const current = await this.getEscrowById(escrowId);
    if (!current) throw new Error("Escrow not found");
    if (current.status !== "pending_funding") {
      throw new Error(`Escrow is already funded or in status: ${current.status}`);
    }

    const now = Timestamp.now();
    const timelineEvent: EscrowEvent = {
      type: "funded",
      timestamp: now as any,
      note: "Escrow funded. Project execution unlocked."
    };

    const docRef = doc(db, COLLECTION_NAME, escrowId);
    await updateDoc(docRef, {
      status: "funded" as EscrowStatus,
      fundedAt: now,
      updatedAt: now,
      timeline: [...(current.timeline || []), timelineEvent]
    });

    // Propagate status side-effects to collaboration
    try {
      const { collaborationService } = await import("@/lib/collaboration-service");
      const collab = await collaborationService.getCollaborationByWorkflowId(current.workflowId);
      if (collab) {
        await collaborationService.logActivity({
          collaborationId: collab.collaborationId,
          actorId,
          actorRole: "business",
          entityType: "escrow",
          entityId: escrowId,
          action: "escrow_funded",
          message: `Business funded escrow for "${current.jobTitle}".`,
        });

        await messageService.sendSystemMessage(
          collab.conversationId,
          collab.collaborationId,
          `Escrow funded successfully. Project execution unlocked.`,
          "escrow",
          escrowId
        );

        // Transition collaboration to active
        await collaborationService.transitionCollaboration(
          collab.collaborationId,
          "active",
          actorId,
          "business",
          { message: "Escrow funded. Execution work unlocked." }
        );
      }
    } catch (e) {
      console.error("Error transitioning collaboration on fundEscrow:", e);
    }

    // Trigger notification to student
    try {
      const { notificationService } = await import("@/lib/notification-service");
      await notificationService.createNotification({
        userId: current.studentId,
        type: "success",
        title: "Escrow Funded! 💰",
        description: `${current.businessName} has funded the escrow for "${current.jobTitle}". Execution is unlocked.`,
        relatedEntityId: escrowId,
        relatedEntityType: "escrow",
        actionUrl: `/workflows/${current.workflowId}`
      });
    } catch (e) {
      console.error("Error sending fund notification:", e);
    }

    const updated = await this.getEscrowById(escrowId);
    return updated!;
  },

  /**
   * Set escrow release eligibility based on milestone approval status.
   */
  async setReleaseEligibility(collaborationId: string, milestoneId: string, isEligible: boolean): Promise<void> {
    if (!db) return;
    const q = query(
      collection(db, COLLECTION_NAME),
      where("collaborationId", "==", collaborationId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const docRef = snap.docs[0].ref;
    const current = snap.docs[0].data() as Escrow;

    const now = Timestamp.now();
    const newStatus: EscrowStatus = isEligible ? "eligible_for_release" : "funded";
    
    // Add timeline event
    const timelineEvent: EscrowEvent = {
      type: isEligible ? "eligible_for_release" : "funded",
      timestamp: now as any,
      note: isEligible 
        ? `Milestone approved. Escrow is now eligible for release.` 
        : `Escrow set back to funded state.`
    };

    await updateDoc(docRef, {
      status: newStatus,
      releaseEligibleAt: isEligible ? now : null,
      updatedAt: now,
      timeline: [...(current.timeline || []), timelineEvent]
    });
  },


  /**
   * Fetch all escrows for a specific user
   */
  async getEscrowsByUser(userId: string, role: "student" | "business"): Promise<Escrow[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where(role === "business" ? "businessId" : "studentId", "==", userId)
      );
      const snap = await getDocs(q);
      const list: Escrow[] = [];
      snap.forEach((d) => {
        list.push(serializeEscrow(d.data(), d.id));
      });
      return list.sort((a, b) => parseToDate(b.updatedAt).getTime() - parseToDate(a.updatedAt).getTime());
    } catch (error) {
      console.error("Error getEscrowsByUser:", error);
      throw new Error(`Firestore query failed for getEscrowsByUser: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Listen to active escrows for live updates
   */
  subscribeToEscrows(userId: string, role: "student" | "business", callback: (escrows: Escrow[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, COLLECTION_NAME),
      where(role === "business" ? "businessId" : "studentId", "==", userId)
    );
    return onSnapshot(q, (snap) => {
      const results: Escrow[] = [];
      snap.forEach((docSnap) => results.push(serializeEscrow(docSnap.data(), docSnap.id)));
      results.sort((a, b) => parseToDate(b.updatedAt).getTime() - parseToDate(a.updatedAt).getTime());
      callback(results);
    });
  },

  /**
   * Fetch escrow summary statistics
   */
  async getEscrowSummary(userId: string, role: "student" | "business"): Promise<EscrowSummary> {
    const list = await this.getEscrowsByUser(userId, role);
    return compileSummary(list);
  },

  /**
   * Fetch an escrow by ID
   */
  async getEscrowById(escrowId: string): Promise<Escrow | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, COLLECTION_NAME, escrowId));
    return snap.exists() ? serializeEscrow(snap.data(), snap.id) : null;
  },

  /**
   * Student marks escrow/work completed (submits deliverable)
   */
  async submitWork(escrowId: string, note: string, actorId?: string, actorRole?: "student" | "business"): Promise<Escrow> {
    if (!db) throw new Error("Firestore is not initialized.");
    const current = await this.getEscrowById(escrowId);
    if (!current) throw new Error("Escrow not found");

    if (actorId && actorRole) {
      const { collaborationService } = await import("@/lib/collaboration-service");
      const collab = await collaborationService.getCollaborationByWorkflowId(current.workflowId);
      if (!collab || !canSubmitDeliverable(actorRole, collab.status)) {
        throw new Error(`Permission denied: Cannot submit deliverable in status '${collab?.status}' as a '${actorRole}'.`);
      }
    }

    const now = Timestamp.now();
    const timelineEvent: EscrowEvent = {
      type: "submitted",
      timestamp: now as any,
      note
    };

    const docRef = doc(db, COLLECTION_NAME, escrowId);
    await updateDoc(docRef, {
      submissionNote: note,
      updatedAt: now,
      timeline: [...(current.timeline || []), timelineEvent]
    });

    // Transition collaboration to in_review
    try {
      const { collaborationService } = await import("@/lib/collaboration-service");
      const collab = await collaborationService.getCollaborationByWorkflowId(current.workflowId);
      if (collab) {
        await collaborationService.transitionCollaboration(
          collab.collaborationId,
          "in_review",
          current.studentId,
          "student",
          { message: `Project submitted for review.`, note }
        );
      }
    } catch (e) {
      console.error("Error transitioning collaboration in submitWork:", e);
    }

    // Trigger notification to business
    try {
      const { notificationService } = await import("@/lib/notification-service");
      await notificationService.createNotification({
        userId: current.businessId,
        type: "success",
        title: "Deliverable Submitted",
        description: `${current.studentName} has submitted deliverables for "${current.jobTitle}".`,
        relatedEntityId: escrowId,
        relatedEntityType: "escrow",
        actionUrl: "/workflows/" + current.workflowId
      });
    } catch (e) {
      console.error("Error sending submit notification:", e);
    }

    const updated = await this.getEscrowById(escrowId);
    return updated!;
  },

  /**
   * Business requests a revision
   */
  async requestRevision(escrowId: string, note: string, actorId?: string, actorRole?: "student" | "business"): Promise<Escrow> {
    if (!db) throw new Error("Firestore is not initialized.");
    const current = await this.getEscrowById(escrowId);
    if (!current) throw new Error("Escrow not found");

    if (actorId && actorRole) {
      const { collaborationService } = await import("@/lib/collaboration-service");
      const collab = await collaborationService.getCollaborationByWorkflowId(current.workflowId);
      if (!collab || !canRequestRevision(actorRole, collab.status)) {
        throw new Error(`Permission denied: Cannot request revision in status '${collab?.status}' as a '${actorRole}'.`);
      }
    }

    const now = Timestamp.now();
    const timelineEvent: EscrowEvent = {
      type: "revision_requested",
      timestamp: now as any,
      note
    };

    const docRef = doc(db, COLLECTION_NAME, escrowId);
    await updateDoc(docRef, {
      revisionNote: note,
      updatedAt: now,
      timeline: [...(current.timeline || []), timelineEvent]
    });

    // Transition collaboration to revision_requested
    try {
      const { collaborationService } = await import("@/lib/collaboration-service");
      const collab = await collaborationService.getCollaborationByWorkflowId(current.workflowId);
      if (collab) {
        await collaborationService.transitionCollaboration(
          collab.collaborationId,
          "revision_requested",
          current.businessId,
          "business",
          { message: `Revision requested on "${current.jobTitle}".`, note }
        );
      }
    } catch (e) {
      console.error("Error transitioning collaboration in requestRevision:", e);
    }

    // Notify student
    try {
      const { notificationService } = await import("@/lib/notification-service");
      await notificationService.createNotification({
        userId: current.studentId,
        type: "warning",
        title: "Revision Requested ⚠️",
        description: `${current.businessName} requested a revision on "${current.jobTitle}".`,
        relatedEntityId: escrowId,
        relatedEntityType: "escrow",
        actionUrl: "/workflows/" + current.workflowId
      });
    } catch (e) {
      console.error("Error sending revision notification:", e);
    }

    const updated = await this.getEscrowById(escrowId);
    return updated!;
  },

  /**
   * Business approves work & releases escrow payment.
   * 
   * TRANSACTIONALLY SAFE: Uses Firestore writeBatch() to atomically commit
   * both escrow release AND collaboration completion. If either fails, neither persists.
   * Escrow release is the ONLY canonical completion authority for collaborations.
   */
  async releaseEscrow(escrowId: string, actorId?: string, actorRole?: "student" | "business"): Promise<Escrow> {
    if (!db) throw new Error("Firestore is not initialized.");
    const current = await this.getEscrowById(escrowId);
    if (!current) throw new Error("Escrow not found");

    if (actorId && actorRole) {
      if (!canReleaseEscrow(actorRole, current.status)) {
        throw new Error(`Permission denied: Cannot release escrow in status '${current.status}' as a '${actorRole}'.`);
      }
    }

    // ── Pre-validation: Ensure collaboration can transition to completed ──
    const { collaborationService } = await import("@/lib/collaboration-service");
    const collab = await collaborationService.getCollaborationByWorkflowId(current.workflowId);
    if (!collab) {
      throw new Error("Cannot release escrow: linked collaboration not found.");
    }

    // Validate the collaboration is in a valid pre-completion state
    const { VALID_TRANSITIONS } = await import("@/types/collaboration");
    const validTargets = VALID_TRANSITIONS[collab.status];
    if (!validTargets || !validTargets.includes("completed")) {
      throw new Error(
        `Cannot release escrow: collaboration is in status "${collab.status}" which cannot transition to "completed".`
      );
    }

    // ── Atomic Batch: Escrow Release + Collaboration Completion ──────────
    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    const now = Timestamp.now();
    const nowISO = new Date().toISOString();

    // 1. Update escrow → released
    const escrowDocRef = doc(db, COLLECTION_NAME, escrowId);
    const timelineEvent: EscrowEvent = {
      type: "released",
      timestamp: now as any,
      note: "Funds released to student wallet."
    };
    batch.update(escrowDocRef, {
      status: "released" as EscrowStatus,
      releasedAt: now,
      updatedAt: now,
      timeline: [...(current.timeline || []), timelineEvent]
    });

    // 2. Update collaboration → completed
    const collabDocRef = doc(db, "collaborations", collab.collaborationId);
    batch.update(collabDocRef, {
      status: "completed",
      completedAt: nowISO,
      updatedAt: nowISO,
    });

    // 2a. Update workflow → completed
    const workflowDocRef = doc(db, "workflows", current.workflowId);
    batch.update(workflowDocRef, {
      status: "completed",
      updatedAt: nowISO,
    });

    // 2b. Update job → Completed
    if (current.jobId) {
      const jobDocRef = doc(db, "jobs", current.jobId);
      batch.update(jobDocRef, {
        status: "Completed",
        updatedAt: nowISO,
      });
    }

    // 2c. Update application → completed
    if (current.applicationId) {
      const appDocRef = doc(db, "applications", current.applicationId);
      batch.update(appDocRef, {
        status: "completed",
        updatedAt: nowISO,
      });
    }

    // 3. Commit atomically — ALL OR NOTHING
    await batch.commit();

    // ── Post-batch side effects (non-transactional, safe to retry) ──────

    // Log collaboration activity for release
    try {
      await messageService.sendSystemMessage(
        collab.conversationId,
        collab.collaborationId,
        `Escrow released successfully. Wallet credited: ₹${current.payoutAmount?.toLocaleString("en-IN")}.`,
        "escrow",
        escrowId
      );
      await collaborationService.logActivity({
        collaborationId: collab.collaborationId,
        actorId: current.businessId,
        actorRole: "business",
        entityType: "escrow",
        entityId: escrowId,
        action: "payment_released",
        fromState: collab.status,
        toState: "completed",
        message: `Escrow payment released for "${current.jobTitle}". Collaboration completed.`,
      });
    } catch (e) {
      console.error("Error logging collaboration activity in releaseEscrow:", e);
    }

    // Log student trust event
    try {
      const { trustService } = await import("@/lib/trust/trust-service");
      await trustService.logTrustEvent(
        current.studentId,
        "student",
        "reliability",
        15,
        `Successful escrow release for "${current.jobTitle}"`,
        current.workflowId,
        "workflow"
      );
    } catch (e) {
      console.error("Error logging trust event in releaseEscrow:", e);
    }

    // Generate portfolio proof-of-work
    try {
      const { portfolioService } = await import("@/lib/portfolio-service");
      await portfolioService.createPortfolioItem({
        userId: current.studentId,
        title: `${current.jobTitle} - Proof of Work`,
        description: `Successfully completed project: "${current.jobTitle}" for client ${current.businessName}.`,
        category: "Web Development", // fallback category
        mediaType: "link",
        mediaUrl: "https://hyperhire.dev/proof/" + current.escrowId,
        tags: ["hyperhire", "verified", "escrow"],
        aiSummary: `Verified proof of milestone completion for "${current.jobTitle}" via HyperHire Escrow contract.`,
        isVerified: true,
        verifiedProofLabel: "Verified Client Project • Completed via HyperHire • Pending Client Review",
        linkedClient: current.businessName,
        linkedWorkflowId: current.workflowId,
        linkedJobId: current.jobId
      } as any);
    } catch (e) {
      console.error("Error generating portfolio proof-of-work:", e);
    }

    // Notify both participants
    try {
      const { notificationService } = await import("@/lib/notification-service");
      await notificationService.createNotification({
        userId: current.studentId,
        type: "success",
        title: "Payment Released! 💸",
        description: `${current.businessName} has released your payment of ₹${current.payoutAmount?.toLocaleString("en-IN")}.`,
        relatedEntityId: escrowId,
        relatedEntityType: "escrow",
        actionUrl: "/workflows/" + current.workflowId
      });
      await notificationService.createNotification({
        userId: current.businessId,
        type: "success",
        title: "Collaboration Completed! 🎉",
        description: `Payment released for "${current.jobTitle}". Collaboration is now closed.`,
        relatedEntityId: escrowId,
        relatedEntityType: "escrow",
        actionUrl: "/workflows/" + current.workflowId
      });
    } catch (e) {
      console.error("Error sending release notification:", e);
    }

    const updated = await this.getEscrowById(escrowId);
    return updated!;
  },

  /**
   * Record operational approval on the escrow ledger timeline
   */
  async approveWork(escrowId: string, note: string, actorId?: string, actorRole?: "student" | "business"): Promise<Escrow> {
    if (!db) throw new Error("Firestore is not initialized.");
    const current = await this.getEscrowById(escrowId);
    if (!current) throw new Error("Escrow not found");

    const now = Timestamp.now();
    const timelineEvent: EscrowEvent = {
      type: "approved",
      timestamp: now as any,
      note
    };

    const docRef = doc(db, COLLECTION_NAME, escrowId);
    await updateDoc(docRef, {
      updatedAt: now,
      timeline: [...(current.timeline || []), timelineEvent]
    });

    const updated = await this.getEscrowById(escrowId);
    return updated!;
  },

  /**
   * Alias legacy function to avoid breaking pages
   */
  async approveEscrow(escrowId: string, note: string): Promise<Escrow> {
    return this.releaseEscrow(escrowId);
  }
};

// Default export compatibility
export default escrowService;
export const getEscrowSummary = (uid: string, role: "student" | "business") => escrowService.getEscrowSummary(uid, role);
export const getEscrowById = (escrowId: string) => escrowService.getEscrowById(escrowId);
export const approveEscrow = (escrowId: string, note: string) => escrowService.approveEscrow(escrowId, note);
export const releaseEscrow = (escrowId: string, actorId?: string, actorRole?: "student" | "business") => escrowService.releaseEscrow(escrowId, actorId, actorRole);
export const submitWork = (escrowId: string, note: string, actorId?: string, actorRole?: "student" | "business") => escrowService.submitWork(escrowId, note, actorId, actorRole);
export const requestRevision = (escrowId: string, note: string, actorId?: string, actorRole?: "student" | "business") => escrowService.requestRevision(escrowId, note, actorId, actorRole);
export const approveWork = (escrowId: string, note: string, actorId?: string, actorRole?: "student" | "business") => escrowService.approveWork(escrowId, note, actorId, actorRole);
export const fundEscrow = (escrowId: string, actorId: string, actorRole: "student" | "business") => escrowService.fundEscrow(escrowId, actorId, actorRole);


