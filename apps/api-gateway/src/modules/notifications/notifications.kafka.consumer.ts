import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from 'libs/kafka/src/kafka.consumer.service';
import { ConsumerConfig, KafkaMessage } from 'kafkajs';
import { KafkaTopics } from 'libs/kafka/src/kafka.config';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './notification.types';

/**
 * Kafka Consumer for Notifications
 *
 * Listens to various Kafka events and creates notifications accordingly
 */
@Injectable()
export class NotificationsKafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(NotificationsKafkaConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Kafka consumers for notifications...');

    // Subscribe to like events
    await this.kafkaConsumer.consume({
      topic: { topic: KafkaTopics.MessageLiked },
      config: { groupId: 'notifications-likes-group' } as ConsumerConfig,
      onMessage: this.handleLikeEvent.bind(this),
    });

    // Subscribe to follow events
    await this.kafkaConsumer.consume({
      topic: { topic: KafkaTopics.UserFollowed },
      config: { groupId: 'notifications-follows-group' } as ConsumerConfig,
      onMessage: this.handleFollowEvent.bind(this),
    });

    // Subscribe to repost events
    await this.kafkaConsumer.consume({
      topic: { topic: KafkaTopics.PostReposted },
      config: { groupId: 'notifications-reposts-group' } as ConsumerConfig,
      onMessage: this.handleRepostEvent.bind(this),
    });

    // Subscribe to post creation (for mentions)
    await this.kafkaConsumer.consume({
      topic: { topic: KafkaTopics.PostCreated },
      config: { groupId: 'notifications-posts-group' } as ConsumerConfig,
      onMessage: this.handlePostCreatedEvent.bind(this),
    });

    this.logger.log('Kafka consumers initialized for notifications');
  }

  /**
   * Handle like events
   * Event structure: { postId, postAuthorId, likerId, likerUsername, postText }
   */
  private async handleLikeEvent(message: KafkaMessage) {
    try {
      const data = JSON.parse(message.value?.toString() ?? '{}');
      this.logger.debug('Received like event:', data);

      // Don't notify if user likes their own post
      if (data.postAuthorId === data.likerId) {
        return;
      }

      await this.notificationsService.createNotification({
        userId: data.postAuthorId, // Post author receives notification
        type: NotificationType.LIKE,
        actorId: data.likerId,
        actorUsername: data.likerUsername,
        actorAvatar: data.likerAvatar,
        postId: data.postId,
        postText: data.postText,
      });

      this.logger.log(`Like notification created: post=${data.postId}, liker=${data.likerId}`);
    } catch (error) {
      this.logger.error('Failed to handle like event:', error.message);
    }
  }

  /**
   * Handle follow events
   * Event structure: { followerId, followerUsername, followeeId }
   */
  private async handleFollowEvent(message: KafkaMessage) {
    try {
      const data = JSON.parse(message.value?.toString() ?? '{}');
      this.logger.debug('Received follow event:', data);

      await this.notificationsService.createNotification({
        userId: data.followeeId, // User being followed receives notification
        type: NotificationType.FOLLOW,
        actorId: data.followerId,
        actorUsername: data.followerUsername,
        actorAvatar: data.followerAvatar,
      });

      this.logger.log(`Follow notification created: follower=${data.followerId}, followee=${data.followeeId}`);
    } catch (error) {
      this.logger.error('Failed to handle follow event:', error.message);
    }
  }

  /**
   * Handle repost events
   * Event structure: { postId, postAuthorId, reposterId, reposterUsername, postText }
   */
  private async handleRepostEvent(message: KafkaMessage) {
    try {
      const data = JSON.parse(message.value?.toString() ?? '{}');
      this.logger.debug('Received repost event:', data);

      // Don't notify if user reposts their own post
      if (data.postAuthorId === data.reposterId) {
        return;
      }

      await this.notificationsService.createNotification({
        userId: data.postAuthorId, // Original post author receives notification
        type: NotificationType.REPOST,
        actorId: data.reposterId,
        actorUsername: data.reposterUsername,
        actorAvatar: data.reposterAvatar,
        postId: data.postId,
        postText: data.postText,
      });

      this.logger.log(`Repost notification created: post=${data.postId}, reposter=${data.reposterId}`);
    } catch (error) {
      this.logger.error('Failed to handle repost event:', error.message);
    }
  }

  /**
   * Handle post creation events (for mentions and replies)
   * Event structure: { postId, authorId, authorUsername, text, mentions, replyToPostId, replyToAuthorId }
   */
  private async handlePostCreatedEvent(message: KafkaMessage) {
    try {
      const data = JSON.parse(message.value?.toString() ?? '{}');
      this.logger.debug('Received post-created event:', data);

      // Handle replies
      if (data.replyToPostId && data.replyToAuthorId) {
        // Don't notify if user replies to their own post
        if (data.authorId !== data.replyToAuthorId) {
          await this.notificationsService.createNotification({
            userId: data.replyToAuthorId,
            type: NotificationType.REPLY,
            actorId: data.authorId,
            actorUsername: data.authorUsername,
            actorAvatar: data.authorAvatar,
            postId: data.postId,
            postText: data.text,
          });

          this.logger.log(`Reply notification created: post=${data.postId}, author=${data.authorId}`);
        }
      }

      // Handle mentions
      if (data.mentions && Array.isArray(data.mentions)) {
        const mentionNotifications = data.mentions
          .filter((mentionedUserId: string) => mentionedUserId !== data.authorId) // Don't notify self
          .map((mentionedUserId: string) => ({
            userId: mentionedUserId,
            type: NotificationType.MENTION,
            actorId: data.authorId,
            actorUsername: data.authorUsername,
            actorAvatar: data.authorAvatar,
            postId: data.postId,
            postText: data.text,
          }));

        if (mentionNotifications.length > 0) {
          await this.notificationsService.createBulkNotifications(mentionNotifications);
          this.logger.log(`Mention notifications created: ${mentionNotifications.length} mentions`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to handle post-created event:', error.message);
    }
  }
}
