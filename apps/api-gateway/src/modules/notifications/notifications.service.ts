import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';
import {
  CreateNotificationInput,
  NotificationDto,
  NotificationItem,
  NotificationType,
} from './notification.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Notifications Service
 *
 * High-level business logic for managing notifications
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly TTL_DAYS = 90; // Notifications expire after 90 days

  constructor(private readonly dynamoDBService: DynamoDBService) {}

  /**
   * Create a new notification
   */
  async createNotification(input: CreateNotificationInput): Promise<NotificationDto> {
    const notificationId = uuidv4();
    const timestamp = Date.now();
    const ttl = Math.floor(timestamp / 1000) + this.TTL_DAYS * 24 * 60 * 60; // Unix timestamp

    const notification: NotificationItem = {
      PK: `USER#${input.userId}`,
      SK: `NOTIF#${timestamp}#${notificationId}`,
      notificationId,
      type: input.type,
      actorId: input.actorId,
      actorUsername: input.actorUsername,
      actorAvatar: input.actorAvatar,
      postId: input.postId,
      postText: input.postText,
      read: false,
      createdAt: timestamp,
      ttl,
    };

    await this.dynamoDBService.putNotification(notification);

    this.logger.log(
      `Notification created: type=${input.type}, userId=${input.userId}, actorId=${input.actorId}`,
    );

    return this.mapToDto(notification);
  }

  /**
   * Get notifications for a user (paginated)
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      unreadOnly?: boolean;
    } = {},
  ): Promise<{
    notifications: NotificationDto[];
    nextCursor?: string;
    unreadCount: number;
  }> {
    const { limit = 20, cursor, unreadOnly = false } = options;

    // Decode cursor if provided
    const lastEvaluatedKey = cursor
      ? JSON.parse(Buffer.from(cursor, 'base64').toString())
      : undefined;

    const { items, lastEvaluatedKey: newLastKey } =
      await this.dynamoDBService.getUserNotifications(userId, {
        limit,
        lastEvaluatedKey,
        filterUnread: unreadOnly,
      });

    // Get unread count
    const unreadCount = await this.dynamoDBService.getUnreadCount(userId);

    // Encode next cursor
    const nextCursor = newLastKey
      ? Buffer.from(JSON.stringify(newLastKey)).toString('base64')
      : undefined;

    return {
      notifications: items.map((item) => this.mapToDto(item)),
      nextCursor,
      unreadCount,
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    // Find the notification to get its sort key
    const { items } = await this.dynamoDBService.getUserNotifications(userId, {
      limit: 100, // Search recent notifications
    });

    const notification = items.find((item) => item.notificationId === notificationId);

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    await this.dynamoDBService.markAsRead(userId, notification.SK);

    this.logger.log(`Notification marked as read: ${notificationId} for user ${userId}`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const count = await this.dynamoDBService.markAllAsRead(userId);
    this.logger.log(`Marked ${count} notifications as read for user ${userId}`);
    return count;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    // Find the notification to get its sort key
    const { items } = await this.dynamoDBService.getUserNotifications(userId, {
      limit: 100,
    });

    const notification = items.find((item) => item.notificationId === notificationId);

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    await this.dynamoDBService.deleteNotification(userId, notification.SK);

    this.logger.log(`Notification deleted: ${notificationId} for user ${userId}`);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.dynamoDBService.getUnreadCount(userId);
  }

  /**
   * Helper: Map DynamoDB item to DTO
   */
  private mapToDto(item: NotificationItem): NotificationDto {
    return {
      id: item.notificationId,
      type: item.type,
      actor: {
        id: item.actorId,
        username: item.actorUsername || 'Unknown',
        avatar: item.actorAvatar,
      },
      post: item.postId
        ? {
            id: item.postId,
            text: item.postText || '',
          }
        : undefined,
      read: item.read,
      readAt: item.readAt,
      createdAt: item.createdAt,
    };
  }

  /**
   * Bulk create notifications (for fan-out scenarios like follows)
   */
  async createBulkNotifications(
    inputs: CreateNotificationInput[],
  ): Promise<void> {
    const createPromises = inputs.map((input) => this.createNotification(input));
    await Promise.all(createPromises);

    this.logger.log(`Created ${inputs.length} notifications in bulk`);
  }
}
