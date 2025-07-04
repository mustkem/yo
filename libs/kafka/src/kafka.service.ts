import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Admin } from 'kafkajs';
import { AppConfigService } from 'libs/config/src';
import { KafkaTopics } from './kafka.config';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly kafka: Kafka;
  private readonly admin: Admin;
  private readonly logger = new Logger(KafkaService.name);

  constructor(private readonly configService: AppConfigService) {
    this.kafka = new Kafka({
      brokers: [this.configService.kafka.broker],
      clientId: 'nestjs-app',
    });

    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    await this.admin.connect();
    this.logger.log('Connected to Kafka admin');

    const existingTopics = await this.admin.listTopics();
    const desiredTopics = Object.values(KafkaTopics);

    const topicsToCreate = desiredTopics
      .filter((topic) => !existingTopics.includes(topic))
      .map((topic) => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1,
      }));

    if (topicsToCreate.length) {
      await this.admin.createTopics({ topics: topicsToCreate });
      this.logger.log(
        `Created topics: ${topicsToCreate.map((t) => t.topic).join(', ')}`,
      );
    } else {
      this.logger.log('All required topics already exist');
    }

    await this.admin.disconnect();
    this.logger.log('Kafka admin disconnected');
  }
}
