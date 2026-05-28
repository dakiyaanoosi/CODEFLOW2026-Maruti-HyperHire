import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { Deliverable, DeliverableComment } from "@/types/deliverable";
import { generateId } from "@/lib/id-utils";

// Helper to serialize deliverable dates for the client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeDeliverable(data: any, id: string): Deliverable {
  return {
    ...data,
    deliverableId: id,
    submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate().toISOString() : data.submittedAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate().toISOString() : data.reviewedAt || null,
  };
}

export const deliverableService = {
  /**
   * Submit a new deliverable version.
   */
  async submitDeliverable(params: {
    collaborationId: string;
    taskId?: string;
    milestoneId?: string;
    submittedBy: string;
    title: string;
    description?: string;
    files: string[];
  }): Promise<Deliverable> {
    if (!db) throw new Error("Firestore is not initialized.");

    // Determine the version number
    let version = 1;
    if (params.taskId) {
      const q = query(
        collection(db, "deliverables"),
        where("taskId", "==", params.taskId)
      );
      const snap = await getDocs(q);
      version = snap.size + 1;
    } else if (params.milestoneId) {
      const q = query(
        collection(db, "deliverables"),
        where("milestoneId", "==", params.milestoneId)
      );
      const snap = await getDocs(q);
      version = snap.size + 1;
    }

    const deliverableId = generateId("deliv");
    const now = Timestamp.now();

    const newDeliverable: Deliverable = {
      deliverableId,
      collaborationId: params.collaborationId,
      taskId: params.taskId || undefined,
      milestoneId: params.milestoneId || undefined,
      submittedBy: params.submittedBy,
      title: params.title,
      description: params.description || "",
      files: params.files,
      version,
      reviewStatus: "pending_review",
      submittedAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "deliverables", deliverableId), newDeliverable);

    // Propagate status side-effects
    if (params.taskId) {
      const taskRef = doc(db, "workflowTasks", params.taskId);
      const taskSnap = await getDoc(taskRef);
      if (taskSnap.exists()) {
        const taskData = taskSnap.data();
        const workflowId = taskData.workflowId;
        const resolvedMilestoneId = taskData.milestoneId || params.milestoneId;

        // Try to update task status and find the "Deliverables" column
        let columnId = taskData.columnId;
        try {
          const qCols = query(
            collection(db, "workflowColumns"),
            where("workflowId", "==", workflowId),
            where("name", "==", "Deliverables")
          );
          const colsSnap = await getDocs(qCols);
          if (!colsSnap.empty) {
            columnId = colsSnap.docs[0].id;
          }
        } catch (e) {
          console.error("Error finding Deliverables column:", e);
        }

        await updateDoc(taskRef, {
          status: "submitted",
          columnId,
          updatedAt: new Date().toISOString(),
        });

        // Submit milestone for review
        if (resolvedMilestoneId) {
          try {
            const { milestoneService } = await import("./milestone-service");
            await milestoneService.submitMilestoneForReview(
              resolvedMilestoneId,
              `Submitted deliverable v${version}: ${params.title}`,
              params.submittedBy
            );
          } catch (e) {
            console.error("Error updating milestone on submitDeliverable:", e);
          }
        }
      }
    } else if (params.milestoneId) {
      try {
        const { milestoneService } = await import("./milestone-service");
        await milestoneService.submitMilestoneForReview(
          params.milestoneId,
          `Submitted deliverable v${version}: ${params.title}`,
          params.submittedBy
        );
      } catch (e) {
        console.error("Error updating milestone on submitDeliverable:", e);
      }
    }

    return serializeDeliverable(newDeliverable, deliverableId);
  },

  /**
   * Retrieve all deliverables for a given task.
   */
  async getDeliverablesByTask(taskId: string): Promise<Deliverable[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "deliverables"),
        where("taskId", "==", taskId),
        orderBy("version", "asc")
      );
      const snap = await getDocs(q);
      const results: Deliverable[] = [];
      snap.forEach((docSnap) => results.push(serializeDeliverable(docSnap.data(), docSnap.id)));
      return results;
    } catch (e) {
      console.error("Error fetching deliverables by task:", e);
      const q = query(
        collection(db, "deliverables"),
        where("taskId", "==", taskId)
      );
      const snap = await getDocs(q);
      const results: Deliverable[] = [];
      snap.forEach((docSnap) => results.push(serializeDeliverable(docSnap.data(), docSnap.id)));
      return results.sort((a, b) => a.version - b.version);
    }
  },

  /**
   * Subscribe to live updates of deliverables for a task.
   */
  subscribeToDeliverables(taskId: string, onUpdate: (deliverables: Deliverable[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, "deliverables"),
      where("taskId", "==", taskId)
    );
    return onSnapshot(q, (snapshot) => {
      const results: Deliverable[] = [];
      snapshot.forEach((docSnap) => results.push(serializeDeliverable(docSnap.data(), docSnap.id)));
      results.sort((a, b) => a.version - b.version);
      onUpdate(results);
    });
  },

  /**
   * Add a review/feedback to a deliverable.
   */
  async reviewDeliverable(
    deliverableId: string,
    reviewerId: string,
    reviewerName: string,
    reviewerRole: "student" | "business",
    status: "approved" | "revision_requested",
    feedback?: string
  ): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");

    const delRef = doc(db, "deliverables", deliverableId);
    const delSnap = await getDoc(delRef);
    if (!delSnap.exists()) throw new Error("Deliverable not found.");

    const data = delSnap.data() as Deliverable;
    const now = Timestamp.now();

    // Update top level review fields
    await updateDoc(delRef, {
      reviewStatus: status,
      feedback: feedback || "",
      reviewedBy: reviewerId,
      reviewedAt: now,
      updatedAt: now,
    });

    const milestoneId = data.milestoneId;
    const taskId = data.taskId;

    // 1. Task Column & Status updates
    if (taskId) {
      const taskRef = doc(db, "workflowTasks", taskId);
      const taskSnap = await getDoc(taskRef);
      if (taskSnap.exists()) {
        const taskData = taskSnap.data();
        const workflowId = taskData.workflowId;
        const targetColumnName = status === "approved" ? "Completed Work" : "Review/Revisions";
        const targetStatus = status === "approved" ? "approved" : "revision_requested";

        let columnId = taskData.columnId;
        try {
          const qCols = query(
            collection(db, "workflowColumns"),
            where("workflowId", "==", workflowId),
            where("name", "==", targetColumnName)
          );
          const colsSnap = await getDocs(qCols);
          if (!colsSnap.empty) {
            columnId = colsSnap.docs[0].id;
          }
        } catch (e) {
          console.error(`Error finding ${targetColumnName} column:`, e);
        }

        await updateDoc(taskRef, {
          status: targetStatus,
          columnId,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Milestone Sync & Status transition
    const resolvedMilestoneId = milestoneId || (taskId ? (await getDoc(doc(db, "workflowTasks", taskId))).data()?.milestoneId : null);
    if (resolvedMilestoneId) {
      const { milestoneService } = await import("./milestone-service");
      if (status === "approved") {
        if (!taskId) {
          await milestoneService.approveMilestone(
            resolvedMilestoneId,
            `Milestone-level deliverable approved.`,
            reviewerId
          );
        } else {
          // Check if all tasks in the milestone are now approved
          const tasksQuery = query(
            collection(db, "workflowTasks"),
            where("milestoneId", "==", resolvedMilestoneId)
          );
          const tasksSnap = await getDocs(tasksQuery);
          const allApproved = tasksSnap.docs.every((docSnap) => docSnap.data().status === "approved");

          if (allApproved) {
            await milestoneService.approveMilestone(
              resolvedMilestoneId,
              `Deliverable approved. All tasks in milestone completed.`,
              reviewerId
            );
          } else {
            await milestoneService.syncMilestoneProgress(resolvedMilestoneId);
          }
        }
      } else if (status === "revision_requested") {
        await milestoneService.requestMilestoneRevision(
          resolvedMilestoneId,
          feedback || "Revision requested on deliverable.",
          reviewerId
        );
      }
    }
  },

  /**
   * Add a comment to a deliverable.
   */
  async addComment(
    deliverableId: string,
    authorId: string,
    authorName: string,
    authorRole: "student" | "business",
    text: string
  ): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");

    const delRef = doc(db, "deliverables", deliverableId);
    const delSnap = await getDoc(delRef);
    if (!delSnap.exists()) throw new Error("Deliverable not found.");

    const data = delSnap.data() as Deliverable;
    const commentId = `cmt_${Date.now()}`;
    const newComment: DeliverableComment = {
      commentId,
      authorId,
      authorName,
      authorRole,
      text,
      createdAt: new Date().toISOString(),
    };

    const comments = [...(data.comments || []), newComment];
    await updateDoc(delRef, { comments });
  },

  /**
   * Retrieve all deliverables for a given milestone.
   */
  async getDeliverablesByMilestone(milestoneId: string): Promise<Deliverable[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, "deliverables"),
        where("milestoneId", "==", milestoneId),
        orderBy("version", "asc")
      );
      const snap = await getDocs(q);
      const results: Deliverable[] = [];
      snap.forEach((docSnap) => results.push(serializeDeliverable(docSnap.data(), docSnap.id)));
      return results;
    } catch (e) {
      console.error("Error fetching deliverables by milestone:", e);
      const q = query(
        collection(db, "deliverables"),
        where("milestoneId", "==", milestoneId)
      );
      const snap = await getDocs(q);
      const results: Deliverable[] = [];
      snap.forEach((docSnap) => results.push(serializeDeliverable(docSnap.data(), docSnap.id)));
      return results.sort((a, b) => a.version - b.version);
    }
  },

  /**
   * Subscribe to live updates of deliverables for a milestone.
   */
  subscribeToMilestoneDeliverables(milestoneId: string, onUpdate: (deliverables: Deliverable[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, "deliverables"),
      where("milestoneId", "==", milestoneId)
    );
    return onSnapshot(q, (snapshot) => {
      const results: Deliverable[] = [];
      snapshot.forEach((docSnap) => results.push(serializeDeliverable(docSnap.data(), docSnap.id)));
      results.sort((a, b) => a.version - b.version);
      onUpdate(results);
    });
  }
};

