export type ApplicationStatus = "Pending" | "Shortlisted" | "Accepted" | "Rejected";

export interface Application {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  businessId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  coverMessage: string;
  proposalText: string;
  estimatedDeliveryDays: number;
  quotedPrice: number;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFormData {
  coverMessage: string;
  proposalText: string;
  estimatedDeliveryDays: number;
  quotedPrice: number;
}
