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
} from "firebase/firestore";
import { Deliverable, DeliverableReview, DeliverableComment } from "@/types/deliverable";
import { generateId } from "@/lib/id-utils";

export const deliverableService = {
  /**
   * Submit a new deliverable version.
   */
  async submitDeliverable(params: {
    collaborationId: string;
    taskId?: string;
    uploadedBy: string;
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
    }

    const deliverableId = generateId("deliv");
    const now = new Date().toISOString();

    const newDeliverable: Deliverable = {
      deliverableId,
      collaborationId: params.collaborationId,
      taskId: params.taskId || undefined,
      uploadedBy: params.uploadedBy,
      title: params.title,
      description: params.description || "",
      files: params.files,
      version,
      reviewStatus: "pending_review",
      createdAt: now,
      reviews: [],
      comments: [],
    };

    await setDoc(doc(db, "deliverables", deliverableId), newDeliverable);
    return newDeliverable;
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
      snap.forEach((docSnap) => results.push(docSnap.data() as Deliverable));
      return results;
    } catch (e) {
      console.error("Error fetching deliverables by task:", e);
      // Fail-safe fallback if index is building or orderby fails
      const q = query(
        collection(db, "deliverables"),
        where("taskId", "==", taskId)
      );
      const snap = await getDocs(q);
      const results: Deliverable[] = [];
      snap.forEach((docSnap) => results.push(docSnap.data() as Deliverable));
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
      snapshot.forEach((docSnap) => results.push(docSnap.data() as Deliverable));
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
    const reviewId = `rev_${Date.now()}`;
    const newReview: DeliverableReview = {
      reviewId,
      reviewerId,
      reviewerName,
      reviewerRole,
      status,
      feedback: feedback || "",
      createdAt: new Date().toISOString(),
    };

    const reviews = [...(data.reviews || []), newReview];
    const reviewStatus = status === "approved" ? "approved" : "revision_requested";

    await updateDoc(delRef, {
      reviews,
      reviewStatus,
    });
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
  }
};
