import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DynamoDBService } from './dynamodb.service';
import { NotificationsKafkaConsumer } from './notifications.kafka.consumer';
import { KafkaModule } from 'libs/kafka/src/kafka.module';

/**
 * Notifications Module
 *
 * Provides notification functionality using DynamoDB for storage
 * and Kafka for event-driven notification creation
 */
@Module({
  imports: [ConfigModule, KafkaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    DynamoDBService,
    NotificationsKafkaConsumer,
  ],
  exports: [NotificationsService], // Export in case other modules need it
})
export class NotificationsModule {}
