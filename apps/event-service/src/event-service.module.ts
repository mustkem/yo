import { Module } from '@nestjs/common';
import { KafkaModule } from 'libs/kafka/src'; // your Kafka module path
import { EventService } from './event-service.service';

@Module({
  imports: [KafkaModule],
  providers: [EventService],
})
export class EventServiceModule {}
