// ─── Canonical Collaboration Status ──────────────────────────────────────────
// This is the SINGLE SOURCE OF TRUTH for the entire collaboration lifecycle.
// Everything else (workflow, escrow, permissions, UI) derives from this.

export type CollaborationStatus =
  | "setup_pending"
  | "scope_review"
  | "awaiting_funding"
  | "active"
  | "in_review"
  | "revision_requested"
  | "completed"
  | "cancelled"
  | "disputed";

// ─── Collaboration Entity ────────────────────────────────────────────────────

export interface Collaboration {
  collaborationId: string;

  // Origin linkage — exactly one of these will be set
  applicationId?: string;
  invitationId?: string;

  // Participants
  businessId: string;
  studentId: string;

  // Metadata
  title: string;
  description: string;

  // Canonical status
  status: CollaborationStatus;

  // Linked entities (created during provisioning)
  workflowId: string;
  conversationId: string;
  escrowId?: string;

  // Future milestone support
  currentMilestoneId?: string;

  // Scope lock
  agreementLocked: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;

  // Denormalized for UI rendering without extra queries
  businessName: string;
  studentName: string;
  studentAvatar?: string;
  businessAvatar?: string;

  // Financial snapshot
  agreedBudget?: number;
}

// ─── State Machine: Valid Transitions ────────────────────────────────────────

export const VALID_TRANSITIONS: Record<CollaborationStatus, CollaborationStatus[]> = {
  setup_pending: ["scope_review", "cancelled"],
  scope_review: ["awaiting_funding", "cancelled"],
  awaiting_funding: ["active", "cancelled"],
  active: ["in_review", "disputed", "cancelled"],
  in_review: ["revision_requested", "completed", "disputed"],
  revision_requested: ["active", "disputed", "cancelled"],
  completed: [],       // Terminal state
  cancelled: [],       // Terminal state
  disputed: [],        // Terminal state (resolved externally in future)
};

// ─── Transition Role Ownership ───────────────────────────────────────────────

export type TransitionActor = "business" | "student" | "either" | "system";

export const TRANSITION_OWNERSHIP: Record<string, TransitionActor> = {
  // Key format: "fromStatus→toStatus"
  "setup_pending→scope_review": "student",
  "setup_pending→cancelled": "either",
  "scope_review→awaiting_funding": "business",
  "scope_review→cancelled": "either",
  "awaiting_funding→active": "business",
  "awaiting_funding→cancelled": "either",
  "active→in_review": "student",
  "active→disputed": "either",
  "active→cancelled": "either",
  "in_review→revision_requested": "business",
  "in_review→completed": "business",
  "in_review→disputed": "either",
  "revision_requested→active": "student",
  "revision_requested→disputed": "either",
  "revision_requested→cancelled": "either",
};

// ─── Activity Event ──────────────────────────────────────────────────────────

export type CollaborationActivityAction =
  | "collaboration_created"
  | "status_transitioned"
  | "scope_accepted"
  | "scope_approved"
  | "escrow_funded"
  | "deliverable_submitted"
  | "revision_requested"
  | "deliverable_approved"
  | "payment_released"
  | "collaboration_cancelled"
  | "dispute_raised"
  | "milestone_submitted"
  | "milestone_revision_requested"
  | "milestone_approved"
  | "milestone_activated";

export interface CollaborationActivityEvent {
  eventId: string;
  collaborationId: string;
  actorId: string;
  actorRole: "student" | "business" | "system";
  entityType: "collaboration" | "escrow" | "task" | "review" | "milestone";
  entityId: string;
  action: CollaborationActivityAction;
  fromState?: string;
  toState?: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ─── Provisioning Parameters ─────────────────────────────────────────────────

export interface ProvisionCollaborationParams {
  applicationId?: string;
  invitationId?: string;
  jobId: string;
  jobTitle: string;
  businessId: string;
  businessName: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  proposedBudget?: number;
  isOnboardingSeeded?: boolean;
}
