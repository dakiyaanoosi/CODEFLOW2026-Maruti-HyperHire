import { Application, ApplicationFormData, ApplicationStatus } from "@/types/application";
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
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { kanbanService } from "@/lib/kanban-service";

function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const COLLECTION_NAME = "applications";

export const applicationService = {
  async submitApplication(
    data: ApplicationFormData,
    jobId: string,
    jobTitle: string,
    companyName: string,
    businessId: string,
    studentId: string,
    studentName: string,
    studentAvatar?: string,
    aiMetadata?: any
  ): Promise<Application> {
    if (!db) throw new Error("Firestore is not initialized.");

    // Check if application already exists
    const q = query(
      collection(db, COLLECTION_NAME),
      where("jobId", "==", jobId),
      where("studentId", "==", studentId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("You have already applied to this job.");
    }

    const appId = generateId();
    const appRef = doc(db, COLLECTION_NAME, appId);
    const now = new Date().toISOString();

    const newApp: Application = {
      applicationId: appId,
      jobId,
      jobTitle,
      companyName,
      businessId,
      studentId,
      studentName,
      studentAvatar,
      coverLetter: data.coverLetter,
      proposalText: data.proposalText,
      estimatedDeliveryDays: data.estimatedDeliveryDays,
      proposedBudget: data.proposedBudget,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
      ...aiMetadata
    };

    await setDoc(appRef, newApp);
    return newApp;
  },

  async getApplicationsByStudent(studentId: string): Promise<Application[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("studentId", "==", studentId)
      );
      const snapshot = await getDocs(q);
      const apps = snapshot.docs.map(doc => doc.data() as Application);
      return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getApplicationsByBusiness(businessId: string): Promise<Application[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("businessId", "==", businessId)
      );
      const snapshot = await getDocs(q);
      const apps = snapshot.docs.map(doc => doc.data() as Application);
      return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("jobId", "==", jobId)
      );
      const snapshot = await getDocs(q);
      const apps = snapshot.docs.map(doc => doc.data() as Application);
      return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async updateStatus(applicationId: string, status: ApplicationStatus): Promise<Application> {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const appRef = doc(db, COLLECTION_NAME, applicationId);
    const snapshot = await getDoc(appRef);
    
    if (!snapshot.exists()) {
      throw new Error("Application not found.");
    }
    
    const now = new Date().toISOString();
    await updateDoc(appRef, {
      status,
      updatedAt: now
    });
    
    const updatedApp = { ...snapshot.data(), status, updatedAt: now } as Application;
    
    // Acceptance Workflow
    if (status === "accepted") {
      try {
        kanbanService.createFromApplication(updatedApp);
      } catch (e) {
        console.error("Error creating Kanban task during acceptance workflow", e);
      }
    }

    return updatedApp;
  },

  async hasApplied(jobId: string, studentId: string): Promise<boolean> {
    if (!db) return false;
    const q = query(
      collection(db, COLLECTION_NAME),
      where("jobId", "==", jobId),
      where("studentId", "==", studentId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  // Stub to fulfill any old interface needs temporarily, but functionally does nothing.
  async seedSampleData(businessId: string, studentId: string): Promise<void> {
    return;
  }
};
