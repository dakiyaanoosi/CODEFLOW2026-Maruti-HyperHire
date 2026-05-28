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
    fundedAt: data.fundedAt?.toDate ? data.fundedAt.toDate().toISOString() : data.fundedAt,
    releasedAt: data.releasedAt?.toDate ? data.releasedAt.toDate().toISOString() : data.releasedAt,
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
    totalFunded:     txns.reduce((s, t) => s + t.amount, 0),
    totalReleased:   txns.filter((t) => t.status === "released").reduce((s, t) => s + (t.payoutAmount || t.amount * 0.9), 0),
    pendingApproval: txns.filter((t) => t.status === "completed").length,
    inReview:        txns.filter((t) => t.status === "completed").length,
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
      status: "funded" as EscrowStatus,
      fundedAt: now,
      createdAt: now,
      updatedAt: now,
      jobTitle: app.jobTitle,
      businessName: app.companyName,
      studentName: app.studentName,
      timeline: [
        { type: "funded", timestamp: now, note: "Escrow funded. Awaiting student delivery." }
      ]
    };

    await setDoc(escrowRef, cleanFirestoreData(newEscrow));

    // Send notification
    try {
      const { notificationService } = await import("@/lib/notification-service");
      await notificationService.createNotification({
        userId: app.studentId,
        type: "success",
        title: "Escrow Funded! 💰",
        description: `Escrow has been funded for "${app.jobTitle}" by ${app.companyName}.`,
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
      type: "completed",
      timestamp: now as any,
      note
    };

    const docRef = doc(db, COLLECTION_NAME, escrowId);
    await updateDoc(docRef, {
      status: "completed" as EscrowStatus,
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
          { message: `Deliverable submitted for "${current.jobTitle}".`, note }
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
        actionUrl: "/escrow"
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
      status: "revision_requested" as EscrowStatus,
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
        actionUrl: "/escrow"
      });
    } catch (e) {
      console.error("Error sending revision notification:", e);
    }

    const updated = await this.getEscrowById(escrowId);
    return updated!;
  },

  /**
   * Business approves work & releases escrow payment
   */
  async releaseEscrow(escrowId: string, actorId?: string, actorRole?: "student" | "business"): Promise<Escrow> {
    if (!db) throw new Error("Firestore is not initialized.");
    const current = await this.getEscrowById(escrowId);
    if (!current) throw new Error("Escrow not found");

    if (actorId && actorRole) {
      const { collaborationService } = await import("@/lib/collaboration-service");
      const collab = await collaborationService.getCollaborationByWorkflowId(current.workflowId);
      if (!collab || !canReleaseEscrow(actorRole, collab.status)) {
        throw new Error(`Permission denied: Cannot release escrow in status '${collab?.status}' as a '${actorRole}'.`);
      }
    }

    const now = Timestamp.now();
    const timelineEvent: EscrowEvent = {
      type: "released",
      timestamp: now as any,
      note: "Funds released to student wallet."
    };

    const docRef = doc(db, COLLECTION_NAME, escrowId);
    await updateDoc(docRef, {
      status: "released" as EscrowStatus,
      releasedAt: now,
      updatedAt: now,
      timeline: [...(current.timeline || []), timelineEvent]
    });

    // 1. Transition collaboration to completed
    try {
      const { collaborationService } = await import("@/lib/collaboration-service");
      const collab = await collaborationService.getCollaborationByWorkflowId(current.workflowId);
      if (collab) {
        await collaborationService.transitionCollaboration(
          collab.collaborationId,
          "completed",
          current.businessId,
          "business",
          { message: `Payment released for "${current.jobTitle}". Collaboration completed.` }
        );
      }
    } catch (e) {
      console.error("Error transitioning collaboration in releaseEscrow:", e);
    }

    // 2. Log student trust event
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

    // 3. Generate portfolio proof-of-work dynamically
    try {
      const { portfolioService } = await import("@/lib/portfolio-service");
      // Add dynamic portfolio item
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

    // 4. Notify student
    try {
      const { notificationService } = await import("@/lib/notification-service");
      await notificationService.createNotification({
        userId: current.studentId,
        type: "success",
        title: "Payment Released! 💸",
        description: `${current.businessName} has released your payment of ₹${current.payoutAmount?.toLocaleString("en-IN")}.`,
        relatedEntityId: escrowId,
        relatedEntityType: "escrow",
        actionUrl: "/escrow"
      });
    } catch (e) {
      console.error("Error sending release notification:", e);
    }

    const updated = await this.getEscrowById(escrowId);
    return updated!;
  },

  /**
   * Alias legacy function to avoid breaking pages
   */
  async approveEscrow(escrowId: string, note: string): Promise<Escrow> {
    // In our new flow, approve maps to releaseEscrow
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
