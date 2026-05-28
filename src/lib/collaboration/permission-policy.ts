import { CollaborationStatus } from "@/types/collaboration";
import { WorkflowTask } from "@/types/workflow";

export type UserRole = "student" | "business";

/**
 * Checks if the actor can create a task of the specified type.
 */
import { TaskStatus } from "@/types/workflow";

export function canCreateTask(
  actorRole: UserRole,
  collabStatus: CollaborationStatus,
  taskType: WorkflowTask["taskType"]
): boolean {
  if (!["active", "in_review", "revision_requested"].includes(collabStatus)) {
    return false;
  }
  
  if (actorRole === "student") {
    return taskType === "execution" || taskType === "deliverable";
  }
  
  if (actorRole === "business") {
    return taskType === "revision" || taskType === "feedback" || taskType === "milestone";
  }
  
  return false;
}

/**
 * Checks if the actor can transition a task to a target status.
 */
export function canTransitionTaskStatus(
  actorId: string,
  actorRole: UserRole,
  collabStatus: CollaborationStatus,
  task: WorkflowTask,
  toStatus: TaskStatus
): boolean {
  if (!["active", "in_review", "revision_requested"].includes(collabStatus)) {
    return false;
  }

  const fromStatus = task.status;

  if (actorRole === "student") {
    // Student can only modify execution or deliverable tasks assigned to them (or owned by them)
    if (actorId !== task.assignedTo && actorId !== task.ownerId && actorId !== task.studentId) {
      return false;
    }

    if (fromStatus === "pending" && toStatus === "in_progress") return true;
    if (fromStatus === "in_progress" && toStatus === "submitted") return true;
    if (fromStatus === "revision_requested" && toStatus === "in_progress") return true;
  }

  if (actorRole === "business") {
    // Business can only transition tasks under their collaboration
    if (actorId !== task.businessId) {
      return false;
    }

    if (fromStatus === "submitted" && toStatus === "approved") return true;
    if (fromStatus === "submitted" && toStatus === "revision_requested") return true;
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
  let targetStatus: TaskStatus;

  if (toColumnName === "Execution Work") {
    targetStatus = "in_progress";
  } else if (toColumnName === "Deliverables") {
    targetStatus = "submitted";
  } else if (toColumnName === "Review/Revisions") {
    targetStatus = "revision_requested";
  } else if (toColumnName === "Completed Work") {
    targetStatus = "approved";
  } else {
    // Backwards compatibility/fallback mapping
    if (toColumnName === "Pending") targetStatus = "pending";
    else if (toColumnName === "In Progress") targetStatus = "in_progress";
    else if (toColumnName === "Revision") targetStatus = "revision_requested";
    else if (toColumnName === "Completed" || toColumnName === "Paid") targetStatus = "approved";
    else return false;
  }

  return canTransitionTaskStatus(actorId, actorRole, collabStatus, task, targetStatus);
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

import { EscrowStatus } from "@/types/escrow";

/**
 * Checks if the actor can fund the escrow.
 */
export function canFundEscrow(actorRole: UserRole, escrowStatus: EscrowStatus): boolean {
  return actorRole === "business" && escrowStatus === "pending_funding";
}

/**
 * Checks if the actor can release the escrow payment.
 */
export function canReleaseEscrow(actorRole: UserRole, escrowStatus: EscrowStatus): boolean {
  return actorRole === "business" && escrowStatus === "eligible_for_release";
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

/**
 * Checks if the actor can submit a milestone for review.
 */
import { MilestoneStatus } from "@/types/milestone";

export function canSubmitMilestone(actorRole: UserRole, milestoneStatus: MilestoneStatus): boolean {
  return actorRole === "student" && (milestoneStatus === "active" || milestoneStatus === "revision_requested");
}

/**
 * Checks if the actor can review/approve or request revision on a milestone.
 */
export function canReviewMilestone(actorRole: UserRole, milestoneStatus: MilestoneStatus): boolean {
  return actorRole === "business" && milestoneStatus === "in_review";
}
