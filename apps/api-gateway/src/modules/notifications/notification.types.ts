/**
 * Notification Types
 */
export enum NotificationType {
  LIKE = 'like',
  FOLLOW = 'follow',
  REPLY = 'reply',
  REPOST = 'repost',
  MENTION = 'mention',
}

/**
 * Notification Item (DynamoDB Document)
 */
export interface NotificationItem {
  PK: string; // USER#<userId>
  SK: string; // NOTIF#<timestamp>#<notificationId>
  notificationId: string;
  type: NotificationType;
  actorId: string; // User who triggered the notification
  actorUsername?: string; // Denormalized for faster display
  actorAvatar?: string; // Denormalized for faster display
  postId?: string; // For like, reply, repost notifications
  postText?: string; // Denormalized snippet
  read: boolean;
  readAt?: number; // Timestamp when marked as read
  createdAt: number; // Timestamp
  ttl: number; // TTL for automatic deletion (90 days)
}

/**
 * Notification Response DTO
 */
export interface NotificationDto {
  id: string;
  type: NotificationType;
  actor: {
    id: string;
    username: string;
    avatar?: string;
  };
  post?: {
    id: string;
    text: string;
  };
  read: boolean;
  readAt?: number;
  createdAt: number;
}

/**
 * Create Notification Input
 */
export interface CreateNotificationInput {
  userId: string; // Who receives the notification
  type: NotificationType;
  actorId: string; // Who triggered it
  actorUsername?: string;
  actorAvatar?: string;
  postId?: string;
  postText?: string;
}
