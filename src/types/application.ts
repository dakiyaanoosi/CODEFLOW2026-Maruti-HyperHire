export type ApplicationStatus = "submitted" | "shortlisted" | "accepted" | "rejected" | "in_progress" | "completed";

export interface Application {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  businessId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  
  // Application Data
  coverLetter: string;
  proposalText: string;
  estimatedDeliveryDays: number;
  proposedBudget: number;
  
  // AI Metadata
  aiPitch?: string;
  aiMatchScore?: number;
  aiMatchConfidence?: number;
  aiMatchExplanation?: string;
  aiSemanticCompatibility?: any;

  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFormData {
  coverLetter: string;
  proposalText: string;
  estimatedDeliveryDays: number;
  proposedBudget: number;
}
