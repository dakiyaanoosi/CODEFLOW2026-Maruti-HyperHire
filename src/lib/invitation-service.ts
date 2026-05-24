import { collection, doc, setDoc, getDocs, getDoc, query, where, updateDoc, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { GigInvitation } from "@/types/invitation";
import { notificationService } from "./notification-service";
import { applicationService } from "./application-service";
import { workflowService } from "./workflow-service";
import { messageService } from "./message-service";

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
  async getPendingInvitations(studentId: string, jobId: string): Promise<GigInvitation[]> {
    if (!isFirebaseConfigured || !db) return [];
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
      return [];
    }
  },

  async enforceCooldown(businessId: string): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return true;
    
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const q = query(
      collection(db, "gigInvitations"),
      where("businessId", "==", businessId),
      where("createdAt", ">", oneHourAgo)
    );
    
    try {
      const snapshot = await getDocs(q);
      if (snapshot.size >= 50) {
        throw new Error("Invitation rate limit exceeded. Please wait before inviting more candidates.");
      }
      return true;
    } catch (error) {
      if ((error as Error).message.includes("rate limit")) throw error;
      return true;
    }
  },

  async createInvitation(
    data: Omit<GigInvitation, "invitationId" | "status" | "createdAt" | "expiresAt">
  ): Promise<GigInvitation> {
    const existing = await this.getPendingInvitations(data.studentId, data.jobId);
    if (existing.length > 0) {
      throw new Error("Candidate has already been invited to this gig.");
    }

    await this.enforceCooldown(data.businessId);

    const invitationId = isFirebaseConfigured && db
      ? doc(collection(db, "gigInvitations")).id
      : "inv_" + Math.random().toString(36).substring(2, 9);

    const invitation: GigInvitation = {
      ...data,
      invitationId,
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    // Firestore does not support `undefined` values. 
    // Strip them before writing to the database.
    const cleanData = Object.fromEntries(
      Object.entries(invitation).filter(([_, v]) => v !== undefined)
    ) as any;

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "gigInvitations", invitationId), cleanData);
    } else {
      const invites = getSimulatedInvites();
      invites[invitationId] = invitation;
      saveSimulatedInvites(invites);
    }

    await notificationService.createNotification({
      userId: data.studentId,
      type: "info",
      title: `You've been invited!`,
      description: `${data.businessName} has invited you to apply for their gig: ${data.jobTitle}`,
      relatedEntityId: data.jobId,
      relatedEntityType: "job",
      actionUrl: `/invitations`
    });

    return invitation;
  },

  async markAsViewed(invitationId: string) {
    if (!isFirebaseConfigured || !db) return;
    const ref = doc(db, "gigInvitations", invitationId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as GigInvitation;
      if (data.status === "pending") {
        await updateDoc(ref, {
          status: "viewed",
          viewedAt: Date.now()
        });
      }
    }
  },

  async getInvitationsForStudent(studentId: string): Promise<GigInvitation[]> {
    if (!isFirebaseConfigured || !db) return [];
    try {
      const q = query(
        collection(db, "gigInvitations"),
        where("studentId", "==", studentId)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => doc.data() as GigInvitation);
      return items.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  /**
   * Master Orchestrator: Converts an Invitation into a Collaboration Workspace
   */
  async acceptInvitation(
    invitationId: string,
    studentName: string,
    studentAvatar: string = "",
    acceptanceNote?: string
  ) {
    if (!isFirebaseConfigured || !db) return;

    const ref = doc(db, "gigInvitations", invitationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Invitation not found");

    const invite = snap.data() as GigInvitation;

    // Idempotency / Duplicate Guard
    if (invite.status === "accepted" || invite.applicationId) {
      throw new Error("This invitation has already been accepted.");
    }
    if (invite.status === "expired") {
      throw new Error("This invitation has expired.");
    }

    const now = Date.now();

    // 1. Synthesize Application or Link Existing
    let app: any = null;
    
    // First, check if the application already exists
    const q = query(
      collection(db, "applications"),
      where("jobId", "==", invite.jobId),
      where("studentId", "==", invite.studentId)
    );
    const existingAppSnap = await getDocs(q);
    
    if (!existingAppSnap.empty) {
      // Re-use existing application if the student had already applied
      app = existingAppSnap.docs[0].data();
    } else {
      // Create new application
      app = await applicationService.submitApplication(
        {
          coverLetter: `[Auto-generated] I am thrilled to accept your invitation to collaborate on ${invite.jobTitle}.`,
          proposalText: "Invitation accepted. Looking forward to discussing the next steps.",
          estimatedDeliveryDays: 14,
          proposedBudget: 0
        },
        invite.jobId,
        invite.jobTitle,
        invite.businessName,
        invite.businessId,
        invite.studentId,
        studentName,
        studentAvatar,
        { sourceType: "invitation", sourceInvitationId: invitationId }
      );
    }

    // Update app status to collaboration_started
    await updateDoc(doc(db, "applications", app.applicationId), {
      status: "collaboration_started"
    });
    
    const updatedApp = { ...app, status: "collaboration_started" as any };

    // 2. Provision Workflow (Seeded with 4 onboarding tasks)
    const workflowId = await workflowService.createWorkflowFromApplication(updatedApp, true); // true = isOnboardingSeeded

    // 3. Initialize Conversation
    const conversation = await messageService.createConversationFromApplication(updatedApp);
    
    // Seed initial message if there's an acceptance note
    if (acceptanceNote) {
      await messageService.sendMessage(
        conversation.conversationId,
        invite.studentId,
        "student",
        acceptanceNote
      );
    }

    // 4. Update Invitation Record
    await updateDoc(ref, {
      status: "accepted",
      acceptedAt: now,
      collaborationStartedAt: now,
      acceptanceNote: acceptanceNote || null,
      applicationId: app.applicationId,
      workflowId: workflowId,
      conversationId: conversation.conversationId
    });

    // 5. Notify Business
    await notificationService.createNotification({
      userId: invite.businessId,
      type: "success",
      title: "Invitation Accepted! 🎉",
      description: `${studentName} accepted your invitation for "${invite.jobTitle}". A collaboration workspace has been provisioned.`,
      relatedEntityId: workflowId,
      relatedEntityType: "workflow",
      actionUrl: `/workflows/${workflowId}`
    });
  },

  async declineInvitation(invitationId: string) {
    if (!isFirebaseConfigured || !db) return;

    const ref = doc(db, "gigInvitations", invitationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Invitation not found");
    const invite = snap.data() as GigInvitation;

    if (invite.status === "accepted") {
      throw new Error("Cannot decline an already accepted invitation.");
    }

    await updateDoc(ref, {
      status: "declined",
      declinedAt: Date.now()
    });

    await notificationService.createNotification({
      userId: invite.businessId,
      type: "warning",
      title: "Invitation Declined",
      description: `A candidate declined your invitation for "${invite.jobTitle}".`,
      relatedEntityId: invitationId,
      relatedEntityType: "profile",
      actionUrl: `/talent`
    });
  }
};
