import { CollaborationStatus } from "@/types/collaboration";
import { WorkflowTask } from "@/types/workflow";

export type UserRole = "student" | "business";

/**
 * Checks if the actor can create a task of the specified type.
 */
export function canCreateTask(
  actorRole: UserRole,
  collabStatus: CollaborationStatus,
  taskType: WorkflowTask["taskType"]
): boolean {
  // Tasks can only be created in active execution states
  if (!["active", "in_review", "revision_requested"].includes(collabStatus)) {
    return false;
  }
  
  if (actorRole === "student") {
    // Student can only create execution tasks
    return taskType === "general" || taskType === "deliverable";
  }
  
  if (actorRole === "business") {
    // Business can create review, revision, feedback, or milestone tasks
    return taskType === "revision" || taskType === "feedback" || taskType === "milestone";
  }
  
  return false;
}

/**
 * Checks if the actor can move a task from one column to another.
 */
export function canMoveTask(
  actorId: string,
  actorRole: UserRole,
  collabStatus: CollaborationStatus,
  task: WorkflowTask,
  fromColumnName: string,
  toColumnName: string
): boolean {
  if (!["active", "in_review", "revision_requested"].includes(collabStatus)) {
    return false;
  }

  // Only task owner may progress execution: Pending (todo) -> In Progress -> Completed
  if (fromColumnName === "Pending" && toColumnName === "In Progress") {
    return actorId === task.ownerId;
  }
  if (fromColumnName === "In Progress" && toColumnName === "Completed") {
    return actorId === task.ownerId;
  }

  // Business may request revision: Completed -> Revision
  if (fromColumnName === "Completed" && toColumnName === "Revision") {
    return actorRole === "business" && actorId === task.businessId;
  }

  // Student may address revision: Revision -> In Progress
  if (fromColumnName === "Revision" && toColumnName === "In Progress") {
    return actorRole === "student" && actorId === task.studentId;
  }

  // Otherwise, default to owner-only movement (prevent arbitrary cross-role manipulation)
  return actorId === task.ownerId;
}

/**
 * Checks if the actor can edit a task's basic details (title, description, due date).
 */
export function canEditTask(
  actorId: string,
  actorRole: UserRole,
  task: WorkflowTask
): boolean {
  // Only the creator or the owner can edit the details of a task
  return actorId === task.createdBy || actorId === task.ownerId;
}

/**
 * Checks if the actor can fund the escrow.
 */
export function canFundEscrow(actorRole: UserRole, collabStatus: CollaborationStatus): boolean {
  return actorRole === "business" && collabStatus === "awaiting_funding";
}

/**
 * Checks if the actor can release the escrow payment.
 */
export function canReleaseEscrow(actorRole: UserRole, collabStatus: CollaborationStatus): boolean {
  return actorRole === "business" && collabStatus === "in_review";
}

/**
 * Checks if the actor can dispute the escrow.
 */
export function canDisputeEscrow(actorRole: UserRole, collabStatus: CollaborationStatus): boolean {
  return actorRole === "business" && ["active", "in_review", "revision_requested"].includes(collabStatus);
}

/**
 * Checks if the actor can submit a deliverable.
 */
export function canSubmitDeliverable(actorRole: UserRole, collabStatus: CollaborationStatus): boolean {
  return actorRole === "student" && (collabStatus === "active" || collabStatus === "revision_requested");
}

/**
 * Checks if the actor can request a revision.
 */
export function canRequestRevision(actorRole: UserRole, collabStatus: CollaborationStatus): boolean {
  return actorRole === "business" && collabStatus === "in_review";
}

/**
 * Checks if the actor can approve a deliverable.
 */
export function canApproveDeliverable(actorRole: UserRole, collabStatus: CollaborationStatus): boolean {
  return actorRole === "business" && collabStatus === "in_review";
}
