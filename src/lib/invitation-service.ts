import { collection, doc, setDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { GigInvitation } from "@/types/invitation";
import { notificationService } from "./notification-service";

const SIMULATED_INVITES_KEY = "hyperhire_simulated_invites";

function getSimulatedInvites(): Record<string, GigInvitation> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(SIMULATED_INVITES_KEY);
  return data ? JSON.parse(data) : {};
}

function saveSimulatedInvites(invites: Record<string, GigInvitation>) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SIMULATED_INVITES_KEY, JSON.stringify(invites));
  }
}

export const invitationService = {
  /**
   * Fetch all pending invitations for a specific student/job to prevent duplicates
   */
  async getPendingInvitations(studentId: string, jobId: string): Promise<GigInvitation[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, "gigInvitations"),
          where("studentId", "==", studentId),
          where("jobId", "==", jobId),
          where("status", "==", "pending")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as GigInvitation);
      } catch (error) {
        console.error("Firestore getPendingInvitations error:", error);
        return this.getSimulatedPending(studentId, jobId);
      }
    } else {
      return this.getSimulatedPending(studentId, jobId);
    }
  },

  getSimulatedPending(studentId: string, jobId: string): GigInvitation[] {
    const invites = getSimulatedInvites();
    return Object.values(invites).filter(
      i => i.studentId === studentId && i.jobId === jobId && i.status === "pending"
    );
  },

  /**
   * Check if a recruiter is spamming invites (simple client-side rate limit simulation)
   */
  async enforceCooldown(businessId: string): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return true; // Skip in simulated mode for ease of use
    
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const q = query(
      collection(db, "gigInvitations"),
      where("businessId", "==", businessId),
      where("createdAt", ">", oneHourAgo)
    );
    
    try {
      const snapshot = await getDocs(q);
      // Hard cap at 50 invites per hour per recruiter to prevent spam
      if (snapshot.size >= 50) {
        throw new Error("Invitation rate limit exceeded. Please wait before inviting more candidates.");
      }
      return true;
    } catch (error) {
      if ((error as Error).message.includes("rate limit")) throw error;
      console.warn("Cooldown check failed, bypassing...", error);
      return true;
    }
  },

  /**
   * Safely create a new invitation
   */
  async createInvitation(
    data: Omit<GigInvitation, "invitationId" | "status" | "createdAt">
  ): Promise<GigInvitation> {
    
    // 1. Duplicate check
    const existing = await this.getPendingInvitations(data.studentId, data.jobId);
    if (existing.length > 0) {
      throw new Error("Candidate has already been invited to this gig.");
    }

    // 2. Cooldown check
    await this.enforceCooldown(data.businessId);

    const invitationId = isFirebaseConfigured && db
      ? doc(collection(db, "gigInvitations")).id
      : "inv_" + Math.random().toString(36).substring(2, 9);

    const invitation: GigInvitation = {
      ...data,
      invitationId,
      status: "pending",
      createdAt: Date.now(),
    };

    // 3. Create real invitation record
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "gigInvitations", invitationId), invitation);
      } catch (error) {
        console.error("Firestore createInvitation error:", error);
        const invites = getSimulatedInvites();
        invites[invitationId] = invitation;
        saveSimulatedInvites(invites);
      }
    } else {
      const invites = getSimulatedInvites();
      invites[invitationId] = invitation;
      saveSimulatedInvites(invites);
    }

    // 4. Fire secondary notification
    await notificationService.createNotification({
      userId: data.studentId,
      type: "info",
      title: `You've been invited!`,
      description: `${data.businessName} has invited you to apply for their gig: ${data.jobTitle}`,
      relatedEntityId: data.jobId,
      relatedEntityType: "job",
      actionUrl: `/jobs`
    });

    return invitation;
  }
};
