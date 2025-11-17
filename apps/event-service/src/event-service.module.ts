import { Module } from '@nestjs/common';
import { KafkaModule } from 'libs/kafka/src'; // your Kafka module path
import { EventService } from './event-service.service';
import { EmailModule } from 'libs/email';

@Module({
  imports: [KafkaModule, EmailModule],
  providers: [EventService],
})
export class EventServiceModule {}
