import { Module } from '@nestjs/common';
import { KafkaModule } from 'libs/kafka/src'; // your Kafka module path
import { NotificationsService } from './notifications-service.service';

@Module({
  imports: [KafkaModule],
  providers: [NotificationsService],
})
export class NotificationsServiceModule {}
