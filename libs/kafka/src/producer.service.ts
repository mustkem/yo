import { Kafka, Producer, logLevel } from 'kafkajs';

export class KafkaProducer {
  private readonly producer: Producer;
  private readonly kafka: Kafka;

  constructor(
    private readonly topic: string,
    private readonly broker: string,
  ) {
    this.kafka = new Kafka({
      clientId: 'nestjs-app-producer',
      brokers: [broker],
      logLevel: logLevel.ERROR,
    });

    this.producer = this.kafka.producer();
  }

  async connect() {
    await this.producer.connect();
  }

  async disconnect() {
    await this.producer.disconnect();
  }

  async produce(message: any) {
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
  }
}
