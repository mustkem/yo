import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaConsumerService } from './kafka.consumer.service';
import { KafkaProducerService } from './kafka.producer.service';
import { AppConfigModule } from 'libs/config/src';

@Module({
  imports: [AppConfigModule],
  providers: [KafkaService, KafkaConsumerService, KafkaProducerService],
  exports: [KafkaService, KafkaConsumerService, KafkaProducerService],
})
export class KafkaModule {}
