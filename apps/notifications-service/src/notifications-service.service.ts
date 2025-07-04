import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from 'libs/kafka/src/kafka.consumer.service';
import { ConsumerConfig, KafkaMessage } from 'kafkajs';
import { KafkaTopics } from 'libs/kafka/src/kafka.config';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(private readonly kafkaConsumer: KafkaConsumerService) {}

  async onModuleInit() {
    await this.kafkaConsumer.consume({
      topic: { topic: KafkaTopics.PostCreated },
      // Use 1 groupId per logical service that needs to consume a topic.
      // Same groupId = shared work (only one processes each message)
      // Different groupIds = independent consumption (both get the message)
      // groupId is only used in consumers
      config: { groupId: 'notifications-service-group' } as ConsumerConfig,
      onMessage: this.handlePostCreated.bind(this),
    });
  }

  private async handlePostCreated(message: KafkaMessage) {
    const data = JSON.parse(message.value?.toString() ?? '{}');
    console.log('📩 Received post-created event:', data);

    // 🔔 Send notification logic here (DB, email, push, etc.)
  }
}
