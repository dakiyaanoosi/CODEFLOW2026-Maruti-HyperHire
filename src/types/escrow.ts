// ─── Escrow Domain Types ──────────────────────────────────────────────────────
export type EscrowStatus =
  | "funded"       
  | "in_review"    
  | "approved"     
  | "released"     
  | "disputed";    
export type EscrowEvent =
  | { type: "funded";    timestamp: string; note?: string }
  | { type: "submitted"; timestamp: string; note?: string }
  | { type: "approved";  timestamp: string; note?: string }
  | { type: "released";  timestamp: string; note?: string }
  | { type: "disputed";  timestamp: string; note?: string };
export interface EscrowTransaction {
  escrowId: string;
  jobId: string;
  jobTitle: string;
  businessId: string;
  businessName: string;
  studentId: string;
  studentName: string;
  amount: number;         
  platformFee: number;    
  netPayout: number;      
  currency: "INR";
  status: EscrowStatus;
  createdAt: string;      
  updatedAt: string;      
  timeline: EscrowEvent[];
  submissionNote?: string;
  approvalNote?: string;  
}
// ─── Summary shapes used by the dashboard widgets ────────────────────────────
export interface EscrowSummary {
  totalFunded: number;
  totalReleased: number;
  pendingApproval: number;   
  inReview: number;          
  transactions: EscrowTransaction[];
}
