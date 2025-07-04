import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { KafkaProducer } from './producer.service';
import { AppConfigService } from 'libs/config/src';
import { KafkaTopic } from './kafka.config';

export interface IProducer {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  produce: (message: any) => Promise<void>;
}

@Injectable()
export class KafkaProducerService implements OnApplicationShutdown {
  private readonly producers = new Map<KafkaTopic, IProducer>();

  constructor(private readonly configService: AppConfigService) {}

  async produce(message: any, topic: KafkaTopic): Promise<void> {
    const producer = await this.getProducer(topic);
    await producer.produce(message);
  }

  private async getProducer(topic: KafkaTopic): Promise<IProducer> {
    let producer = this.producers.get(topic);
    if (!producer) {
      producer = new KafkaProducer(topic, this.configService.kafka.broker);
      await producer.connect();
      this.producers.set(topic, producer);
    }
    return producer;
  }

  async onApplicationShutdown() {
    for (const producer of this.producers.values()) {
      await producer.disconnect();
    }
  }
}
