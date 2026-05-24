export type NotificationType = 
  | "info"
  | "success"
  | "warning"
  | "urgent"
  | "ai_insight"
  | "application"
  | "message"
  | "workflow"
  | "task"
  | "analytics"
  | "system";

export type EntityType = 
  | "application"
  | "workflow"
  | "message"
  | "task"
  | "job"
  | "analytics"
  | "profile";

export interface SystemNotification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  relatedEntityId?: string;
  relatedEntityType?: EntityType;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: number;
}
