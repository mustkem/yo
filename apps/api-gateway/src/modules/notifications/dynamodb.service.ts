import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { createDynamoDBClient, DYNAMODB_TABLES } from './dynamodb.config';

/**
 * DynamoDB Service
 *
 * Low-level wrapper for DynamoDB operations specific to notifications
 */
@Injectable()
export class DynamoDBService implements OnModuleInit {
  private readonly logger = new Logger(DynamoDBService.name);
  private docClient: DynamoDBDocumentClient;
  private readonly tableName = DYNAMODB_TABLES.USER_NOTIFICATIONS;

  onModuleInit() {
    this.docClient = createDynamoDBClient();
    this.logger.log(`DynamoDB client initialized for table: ${this.tableName}`);
  }

  /**
   * Create a notification
   */
  async putNotification(notification: any): Promise<void> {
    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: notification,
        }),
      );
      this.logger.debug(`Notification created: ${notification.SK}`);
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get notifications for a user (paginated)
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      lastEvaluatedKey?: Record<string, any>;
      filterUnread?: boolean;
    } = {},
  ): Promise<{
    items: any[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    try {
      const { limit = 20, lastEvaluatedKey, filterUnread } = options;

      const params: any = {
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
        },
        ScanIndexForward: false, // Sort by SK descending (newest first)
        Limit: limit,
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      // Optional: Filter for unread notifications
      if (filterUnread) {
        params.FilterExpression = '#read = :false';
        params.ExpressionAttributeNames = {
          '#read': 'read',
        };
        params.ExpressionAttributeValues[':false'] = false;
      }

      const result = await this.docClient.send(new QueryCommand(params));

      return {
        items: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error) {
      this.logger.error(`Failed to get notifications for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific notification
   */
  async getNotification(userId: string, sortKey: string): Promise<any | null> {
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            PK: `USER#${userId}`,
            SK: sortKey,
          },
        }),
      );

      return result.Item || null;
    } catch (error) {
      this.logger.error(`Failed to get notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, sortKey: string): Promise<void> {
    try {
      await this.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            PK: `USER#${userId}`,
            SK: sortKey,
          },
          UpdateExpression: 'SET #read = :true, readAt = :readAt',
          ExpressionAttributeNames: {
            '#read': 'read',
          },
          ExpressionAttributeValues: {
            ':true': true,
            ':readAt': Date.now(),
          },
        }),
      );
      this.logger.debug(`Notification marked as read: ${sortKey}`);
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      // First, get all unread notifications
      const { items } = await this.getUserNotifications(userId, {
        limit: 100,
        filterUnread: true,
      });

      // Batch update them
      const updatePromises = items.map((item) =>
        this.markAsRead(userId, item.SK),
      );

      await Promise.all(updatePromises);

      this.logger.log(`Marked ${items.length} notifications as read for user ${userId}`);
      return items.length;
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, sortKey: string): Promise<void> {
    try {
      await this.docClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: {
            PK: `USER#${userId}`,
            SK: sortKey,
          },
        }),
      );
      this.logger.debug(`Notification deleted: ${sortKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { items } = await this.getUserNotifications(userId, {
        limit: 100, // Reasonable limit for unread count
        filterUnread: true,
      });

      return items.length;
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`, error.stack);
      throw error;
    }
  }
}
