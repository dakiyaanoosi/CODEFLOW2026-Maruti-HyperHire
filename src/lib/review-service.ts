import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import { Review } from "@/types/review";
import { Workflow } from "@/types/workflow";
import { trustService } from "@/lib/trust/trust-service";
import { portfolioService } from "@/lib/portfolio-service";
import { getBusinessDocRefByOwnerId } from "./business/business-lookup";

const COLLECTION_NAME = "reviews";

export const reviewService = {
  /**
   * Fetches all submitted reviews for a user (as the reviewee/recipient of the review).
   */
  async getReviewsForUser(userId: string): Promise<Review[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("revieweeId", "==", userId),
        where("status", "==", "submitted")
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data() as Review);
    } catch (e) {
      console.error("Error fetching reviews for user:", e);
      throw new Error(`Firestore query failed for getReviewsForUser: ${e instanceof Error ? e.message : String(e)}`);
    }
  },

  /**
   * Fetches the specific review between a reviewer and a workflow.
   */
  async getReviewById(reviewId: string): Promise<Review | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, COLLECTION_NAME, reviewId));
    return snap.exists() ? (snap.data() as Review) : null;
  },

  /**
   * Checks if a review has already been submitted for a workflow by a specific reviewer.
   */
  async hasSubmittedReview(reviewerId: string, workflowId: string): Promise<boolean> {
    if (!db) return false;
    const reviewId = `rev_${reviewerId}_${workflowId}`;
    const snap = await getDoc(doc(db, COLLECTION_NAME, reviewId));
    return snap.exists();
  },

  /**
   * Submits a completed review, logs trust events, updates reputation metrics, and enriches portfolio proof.
   */
  async submitReview(
    reviewerId: string,
    workflowId: string,
    data: {
      rating: number;
      communicationRating?: number;
      qualityRating?: number;
      timelinessRating?: number;
      reviewText?: string;
    }
  ): Promise<Review> {
    if (!db) throw new Error("Firestore is not initialized.");

    // Fetch the workflow details
    const workflowRef = doc(db, "workflows", workflowId);
    const workflowSnap = await getDoc(workflowRef);
    if (!workflowSnap.exists()) {
      throw new Error("Workflow not found.");
    }
    const workflow = workflowSnap.data() as Workflow;

    // Fetch the escrow to find the escrowId and verify status
    const escrowId = `esc_${workflow.applicationId}`;
    const escrowRef = doc(db, "escrows", escrowId);
    const escrowSnap = await getDoc(escrowRef);
    if (!escrowSnap.exists()) {
      throw new Error("Escrow document not found.");
    }
    const escrowData = escrowSnap.data();
    if (escrowData.status !== "released") {
      throw new Error("Cannot submit review before escrow is released.");
    }

    const reviewId = `rev_${reviewerId}_${workflowId}`;
    const reviewRef = doc(db, COLLECTION_NAME, reviewId);
    const existingSnap = await getDoc(reviewRef);

    if (existingSnap.exists()) {
      throw new Error("You have already submitted a review for this project.");
    }

    const reviewerRole = reviewerId === workflow.studentId ? "student" : "business";
    const revieweeId = reviewerRole === "student" ? workflow.businessId : workflow.studentId;

    const now = Timestamp.now();
    const newReview: Review = {
      reviewId,
      workflowId,
      escrowId,
      applicationId: workflow.applicationId,
      businessId: workflow.businessId,
      studentId: workflow.studentId,
      reviewerId,
      revieweeId,
      reviewerRole,
      rating: data.rating,
      communicationRating: data.communicationRating || data.rating,
      qualityRating: data.qualityRating || data.rating,
      timelinessRating: data.timelinessRating || data.rating,
      reviewText: data.reviewText || "",
      status: "submitted",
      createdAt: now,
      updatedAt: now
    };

    await setDoc(reviewRef, newReview);

    // 1. Log trust events based on the ratings
    const isStudentReviewee = reviewerRole === "business";

    // Map 1-5 stars to impact scores: 5 -> +3, 4 -> +1, 3 -> 0, 2 -> -3, 1 -> -5
    const getImpact = (val?: number) => {
      const star = val || data.rating;
      if (star === 5) return 3;
      if (star === 4) return 1;
      if (star === 3) return 0;
      if (star === 2) return -3;
      return -5;
    };

    const overallImpact = getImpact(data.rating);
    const commImpact = getImpact(data.communicationRating);
    const qualImpact = getImpact(data.qualityRating);
    const timeImpact = getImpact(data.timelinessRating);

    if (isStudentReviewee) {
      // Log trust events for Student
      await trustService.logTrustEvent(
        revieweeId,
        "student",
        "delivery",
        overallImpact,
        `Client Review (Overall: ${data.rating}/5)`,
        workflowId,
        "workflow"
      );
      await trustService.logTrustEvent(
        revieweeId,
        "student",
        "communication",
        commImpact,
        `Client Review (Communication: ${data.communicationRating || data.rating}/5)`,
        workflowId,
        "workflow"
      );
      await trustService.logTrustEvent(
        revieweeId,
        "student",
        "delivery",
        qualImpact,
        `Client Review (Quality: ${data.qualityRating || data.rating}/5)`,
        workflowId,
        "workflow"
      );
      await trustService.logTrustEvent(
        revieweeId,
        "student",
        "reliability",
        timeImpact,
        `Client Review (Timeliness: ${data.timelinessRating || data.rating}/5)`,
        workflowId,
        "workflow"
      );

      // 2. Enrich the verified portfolio item with this review
      try {
        const portfolios = await portfolioService.getPortfolios(revieweeId);
        const matchedPortfolio = portfolios.find(p => p.linkedWorkflowId === workflowId);
        
        if (matchedPortfolio) {
          await portfolioService.updatePortfolioItem(matchedPortfolio.portfolioId, {
            verifiedProofLabel: `Verified Client Project • Completed via HyperHire • Business Reviewed • ${data.rating.toFixed(1)}/5 Collaboration Rating`,
            linkedClient: matchedPortfolio.linkedClient || workflow.businessName,
            isVerified: true
          });

          // Workaround to add direct fields for details view by writing directly
          const portRef = doc(db, "portfolios", matchedPortfolio.portfolioId);
          await updateDoc(portRef, {
            clientRating: data.rating,
            clientReviewText: data.reviewText || "",
            linkedReviewId: reviewId,
            completionDate: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Error updating portfolio item with review proof:", e);
      }
    } else {
      // Log trust events for Business
      await trustService.logTrustEvent(
        revieweeId,
        "business",
        "collaboration",
        overallImpact,
        `Student Review (Overall: ${data.rating}/5)`,
        workflowId,
        "workflow"
      );
      await trustService.logTrustEvent(
        revieweeId,
        "business",
        "communication",
        commImpact,
        `Student Review (Communication: ${data.communicationRating || data.rating}/5)`,
        workflowId,
        "workflow"
      );
      await trustService.logTrustEvent(
        revieweeId,
        "business",
        "collaboration",
        qualImpact,
        `Student Review (Professionalism: ${data.qualityRating || data.rating}/5)`,
        workflowId,
        "workflow"
      );
      await trustService.logTrustEvent(
        revieweeId,
        "business",
        "reliability",
        timeImpact,
        `Student Review (Approval Speed: ${data.timelinessRating || data.rating}/5)`,
        workflowId,
        "workflow"
      );
    }

    // 3. Recalculate client/student reputation averages
    await this.recalculateReputation(revieweeId, isStudentReviewee ? "student" : "business");

    return newReview;
  },

  /**
   * Queries submitted reviews, aggregates scores, and updates the profile in the users or businesses collection.
   */
  async recalculateReputation(userId: string, role: "student" | "business"): Promise<void> {
    if (!db) return;

    const reviews = await this.getReviewsForUser(userId);
    const reviewCount = reviews.length;
    
    let averageRating = 0;
    let repeatClientRate = 0;
    
    if (reviewCount > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      averageRating = parseFloat((totalRating / reviewCount).toFixed(2));

      if (role === "student") {
        const clientCounts: Record<string, number> = {};
        reviews.forEach(r => {
          clientCounts[r.reviewerId] = (clientCounts[r.reviewerId] || 0) + 1;
        });

        const repeatClientsCount = reviews.filter(r => clientCounts[r.reviewerId] > 1).length;
        repeatClientRate = Math.round((repeatClientsCount / reviewCount) * 100);
      }
    }

    // Fetch verified project count from portfolios
    let verifiedProjectsCount = 0;
    if (role === "student") {
      try {
        const portfolios = await portfolioService.getPortfolios(userId);
        verifiedProjectsCount = portfolios.filter(p => p.isVerified).length;
      } catch (e) {
        console.error("Failed to query portfolios for reputation recalculation:", e);
      }
    }

    let docRef;
    if (role === "student") {
      docRef = doc(db, "users", userId);
    } else {
      try {
        const resolvedRef = await getBusinessDocRefByOwnerId(userId);
        if (!resolvedRef) {
          console.warn(`[Review Service] Missing business profile for owner ID: ${userId}. Creating dynamic fallback.`);
          const { businessService } = await import("./business-service");
          let name = "My Business Org";
          let email = "";
          try {
            const userSnap = await getDoc(doc(db, "users", userId));
            if (userSnap.exists()) {
              const uData = userSnap.data();
              name = uData.name || name;
              email = uData.email || email;
            }
          } catch (e) {
            console.error("[Review Service] Failed to retrieve user details for business profile creation fallback:", e);
          }
          const defaultProfile = await businessService.createDefaultBusinessProfile(userId, email, name);
          docRef = doc(db, "businesses", defaultProfile.businessId);
        } else {
          docRef = resolvedRef;
        }
      } catch (err) {
        console.error(`[Review Service] Error resolving business document for owner ID: ${userId}:`, err);
        throw new Error(`Failed to resolve business document reference for owner ID: ${userId}. ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    const updateData: Record<string, unknown> = {
      averageRating,
      reviewCount,
      updatedAt: new Date().toISOString()
    };

    if (role === "student") {
      updateData.repeatClientRate = repeatClientRate;
      updateData.verifiedProjectsCount = verifiedProjectsCount;
    } else {
      updateData.collaborationQualityScore = averageRating; // Denormalized for business quality indicator
    }

    try {
      await updateDoc(docRef, updateData);
      console.log(`[Review Service] Recalculated reputation for ${role} ${userId}: Avg Rating=${averageRating}, Count=${reviewCount}`);
    } catch (e) {
      console.error(`[Review Service] Error updating reputation document for ${role} ${userId}:`, e);
      throw new Error(`Failed to update reputation for ${role} ${userId}. ${e instanceof Error ? e.message : String(e)}`);
    }
  }
};
