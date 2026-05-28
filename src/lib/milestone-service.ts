import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import type { Milestone } from "@/types/milestone";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeMilestone(data: any, id: string): Milestone {
  return {
    ...data,
    milestoneId: id,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    approvedAt: data.approvedAt?.toDate ? data.approvedAt.toDate().toISOString() : data.approvedAt,
    dueDate: data.dueDate?.toDate ? data.dueDate.toDate().toISOString() : data.dueDate,
  };
}

export const milestoneService = {
  /**
   * Provision default milestones for a collaboration
   */
  async createDefaultMilestones(collaborationId: string, createdBy: string): Promise<string[]> {
    if (!db) throw new Error("Firestore is not initialized.");
    const batch = writeBatch(db);
    const now = Timestamp.now();
    const defaults = [
      {
        title: "Project Kickoff & Setup",
        desc: "Define project objectives, timeline, and kickoff requirements.",
        order: 0,
        status: "active" as const,
      },
      {
        title: "Core Development & Implementation",
        desc: "Build out the primary execution deliverables.",
        order: 1,
        status: "pending" as const,
      },
      {
        title: "Final Handover & Review",
        desc: "Complete all final review items and deliver assets to client.",
        order: 2,
        status: "pending" as const,
      },
    ];

    const createdIds: string[] = [];
    defaults.forEach((def) => {
      const milestoneId = `ms_${collaborationId}_${def.order}`;
      createdIds.push(milestoneId);
      const docRef = doc(db!, "milestones", milestoneId);
      batch.set(docRef, {
        milestoneId,
        collaborationId,
        title: def.title,
        description: def.desc,
        status: def.status,
        progress: 0,
        order: def.order,
        createdBy,
        createdAt: now,
        updatedAt: now,
        eligibleForRelease: false,
      });
    });

    await batch.commit();
    return createdIds;
  },

  /**
   * Retrieve milestones for a collaboration
   */
  async getMilestones(collaborationId: string): Promise<Milestone[]> {
    if (!db) return [];
    const q = query(
      collection(db, "milestones"),
      where("collaborationId", "==", collaborationId),
      orderBy("order", "asc")
    );
    const snap = await getDocs(q);
    const results: Milestone[] = [];
    snap.forEach((d) => {
      results.push(serializeMilestone(d.data(), d.id));
    });
    return results;
  },

  /**
   * Subscribe to live milestone updates
   */
  subscribeToMilestones(collaborationId: string, callback: (milestones: Milestone[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, "milestones"),
      where("collaborationId", "==", collaborationId),
      orderBy("order", "asc")
    );
    return onSnapshot(q, (snap) => {
      const list: Milestone[] = [];
      snap.forEach((d) => {
        list.push(serializeMilestone(d.data(), d.id));
      });
      callback(list);
    });
  },

  /**
   * Submit a milestone for review
   */
  async submitMilestoneForReview(milestoneId: string, note: string, actorId: string): Promise<Milestone> {
    if (!db) throw new Error("Firestore not initialized.");
    const docRef = doc(db, "milestones", milestoneId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Milestone not found.");
    const data = snap.data() as Milestone;

    const now = Timestamp.now();
    await updateDoc(docRef, {
      status: "in_review",
      submissionNote: note,
      updatedAt: now,
    });

    // Log activity
    const { collaborationService } = await import("./collaboration-service");
    await collaborationService.logActivity({
      collaborationId: data.collaborationId,
      actorId,
      actorRole: "student",
      entityType: "milestone",
      entityId: milestoneId,
      action: "milestone_submitted",
      fromState: data.status,
      toState: "in_review",
      message: `Submitted Milestone "${data.title}" for review.`,
      metadata: { note },
    });

    // Trigger notification to business
    try {
      const { notificationService } = await import("@/lib/notification-service");
      const collab = await collaborationService.getCollaboration(data.collaborationId);
      if (collab) {
        await notificationService.createNotification({
          userId: collab.businessId,
          type: "success",
          title: "Milestone Submitted",
          description: `Freelancer submitted "${data.title}" for review.`,
          relatedEntityId: collab.workflowId,
          relatedEntityType: "workflow",
          actionUrl: `/workflows/${collab.workflowId}`,
        });
      }
    } catch (e) {
      console.error("Error sending milestone submit notification:", e);
    }

    const updated = await getDoc(docRef);
    return serializeMilestone(updated.data(), updated.id);
  },

  /**
   * Request revision on a milestone
   */
  async requestMilestoneRevision(milestoneId: string, note: string, actorId: string): Promise<Milestone> {
    if (!db) throw new Error("Firestore not initialized.");
    const docRef = doc(db, "milestones", milestoneId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Milestone not found.");
    const data = snap.data() as Milestone;

    const now = Timestamp.now();
    await updateDoc(docRef, {
      status: "revision_requested",
      revisionNote: note,
      updatedAt: now,
    });

    try {
      const { escrowService } = await import("./escrow-service");
      await escrowService.setReleaseEligibility(data.collaborationId, milestoneId, false);
    } catch (e) {
      console.error("Error setting release eligibility on requestMilestoneRevision:", e);
    }

    // Log activity
    const { collaborationService } = await import("./collaboration-service");
    await collaborationService.logActivity({
      collaborationId: data.collaborationId,
      actorId,
      actorRole: "business",
      entityType: "milestone",
      entityId: milestoneId,
      action: "milestone_revision_requested",
      fromState: data.status,
      toState: "revision_requested",
      message: `Requested revision for Milestone "${data.title}".`,
      metadata: { note },
    });

    // Trigger notification to student
    try {
      const { notificationService } = await import("@/lib/notification-service");
      const collab = await collaborationService.getCollaboration(data.collaborationId);
      if (collab) {
        await notificationService.createNotification({
          userId: collab.studentId,
          type: "warning",
          title: "Milestone Revision Requested ⚠️",
          description: `Client requested a revision on "${data.title}".`,
          relatedEntityId: collab.workflowId,
          relatedEntityType: "workflow",
          actionUrl: `/workflows/${collab.workflowId}`,
        });
      }
    } catch (e) {
      console.error("Error sending milestone revision notification:", e);
    }

    const updated = await getDoc(docRef);
    return serializeMilestone(updated.data(), updated.id);
  },

  /**
   * Approve a milestone
   */
  async approveMilestone(milestoneId: string, note: string, actorId: string): Promise<Milestone> {
    if (!db) throw new Error("Firestore not initialized.");
    const docRef = doc(db, "milestones", milestoneId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Milestone not found.");
    const data = snap.data() as Milestone;

    const now = Timestamp.now();
    await updateDoc(docRef, {
      status: "approved",
      progress: 100,
      approvedAt: now,
      updatedAt: now,
      eligibleForRelease: true,
    });

    try {
      const { escrowService } = await import("./escrow-service");
      await escrowService.setReleaseEligibility(data.collaborationId, milestoneId, true);
    } catch (e) {
      console.error("Error setting release eligibility on approveMilestone:", e);
    }

    const { collaborationService } = await import("./collaboration-service");
    await collaborationService.logActivity({
      collaborationId: data.collaborationId,
      actorId,
      actorRole: "business",
      entityType: "milestone",
      entityId: milestoneId,
      action: "milestone_approved",
      fromState: data.status,
      toState: "approved",
      message: `Approved Milestone "${data.title}".`,
      metadata: note ? { note } : undefined,
    });

    // Activate next milestone or complete collaboration
    const q = query(
      collection(db, "milestones"),
      where("collaborationId", "==", data.collaborationId),
      orderBy("order", "asc")
    );
    const milestonesSnap = await getDocs(q);
    const milestones = milestonesSnap.docs.map((d) => d.data() as Milestone);
    const currentOrder = data.order;
    const nextMilestone = milestones.find((m) => m.order === currentOrder + 1);

    if (nextMilestone) {
      const nextRef = doc(db, "milestones", nextMilestone.milestoneId);
      await updateDoc(nextRef, {
        status: "active",
        updatedAt: now,
      });

      await collaborationService.logActivity({
        collaborationId: data.collaborationId,
        actorId,
        actorRole: "system",
        entityType: "milestone",
        entityId: nextMilestone.milestoneId,
        action: "milestone_activated",
        fromState: nextMilestone.status,
        toState: "active",
        message: `Milestone "${nextMilestone.title}" has been activated.`,
      });

      // Trigger notification to student
      try {
        const { notificationService } = await import("@/lib/notification-service");
        const collab = await collaborationService.getCollaboration(data.collaborationId);
        if (collab) {
          await notificationService.createNotification({
            userId: collab.studentId,
            type: "success",
            title: "Milestone Approved & Next Activated! 🎉",
            description: `"${data.title}" approved. "${nextMilestone.title}" is now active.`,
            relatedEntityId: collab.workflowId,
            relatedEntityType: "workflow",
            actionUrl: `/workflows/${collab.workflowId}`,
          });
        }
      } catch (e) {
        console.error("Error sending milestone approval notification:", e);
      }
    } else {
      // Complete collaboration if it was the last milestone
      const collab = await collaborationService.getCollaboration(data.collaborationId);
      if (collab) {
        await collaborationService.transitionCollaboration(
          collab.collaborationId,
          "completed",
          actorId,
          "business",
          { message: `All milestones approved. Collaboration "${collab.title}" completed!` }
        );
      }
    }

    const updated = await getDoc(docRef);
    return serializeMilestone(updated.data(), updated.id);
  },

  /**
   * Sync and recalculate the progress of a milestone
   */
  async syncMilestoneProgress(milestoneId: string): Promise<number> {
    if (!db) return 0;
    const docRef = doc(db, "milestones", milestoneId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return 0;
    const milestoneData = snap.data() as Milestone;

    if (milestoneData.status === "approved") {
      return 100;
    }

    const q = query(
      collection(db, "workflowTasks"),
      where("milestoneId", "==", milestoneId)
    );
    const tasksSnap = await getDocs(q);
    if (tasksSnap.empty) {
      return 0;
    }

    const tasks = tasksSnap.docs.map((d) => d.data());
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "approved").length;
    const progress = Math.round((completed / total) * 100);

    await updateDoc(docRef, {
      progress,
      updatedAt: Timestamp.now(),
    });

    return progress;
  },
};
