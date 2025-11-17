import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from 'libs/kafka/src/kafka.consumer.service';
import { ConsumerConfig, KafkaMessage } from 'kafkajs';
import { KafkaTopics } from 'libs/kafka/src/kafka.config';
import { EmailService } from 'libs/email';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EventService implements OnModuleInit {
  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumer.consume({
      topic: { topic: KafkaTopics.PostCreated },
      // Use 1 groupId per logical service that needs to consume a topic.
      // Same groupId = shared work (only one processes each message)
      // Different groupIds = independent consumption (both get the message)
      // groupId is only used in consumers
      config: { groupId: 'event-service-group' } as ConsumerConfig,
      onMessage: this.handlePostCreated.bind(this),
    });

    await this.kafkaConsumer.consume({
      topic: { topic: KafkaTopics.UserLoggedIn },
      // dedicated group so user-login events are always consumed
      config: { groupId: 'event-service-user-logged-in' } as ConsumerConfig,
      onMessage: this.handleUserLoggedIn.bind(this),
    });
  }

  private async handlePostCreated(message: KafkaMessage) {
    const data = JSON.parse(message.value?.toString() ?? '{}');
    console.log('📩 Received post-created event:', data);

    // 🔔 Send notification logic here (DB, email, push, etc.)
  }

  private async handleUserLoggedIn(message: KafkaMessage) {
    const data = JSON.parse(message.value?.toString() ?? '{}');
    console.log('👤 User logged in event:', data);
    await this.sendLoginEmail(data);
  }

  private async sendLoginEmail(data: any) {
    const recipientEmail = data.email;
    if (!recipientEmail) {
      console.log('⚠️ User logged in event missing email, skipping email send');
      return;
    }

    const emailConfig = this.configService.get('email');
    const fromEmail = emailConfig?.ses?.senderEmail;
    const templateId =
      process.env.SES_EMAIL_CONFIRMATION_TEMPLATE ||
      'EmailConfirmationTemplate';

    try {
      const result = await this.emailService.sendTemplatedEmail({
        templateId,
        fromEmail,
        toEmail: recipientEmail,
        templateData: {
          username: data.username ?? 'user',
          loggedInAt: data.loggedInAt ?? new Date().toISOString(),
        },
      });
      console.log('✅ Login email sent', {
        to: recipientEmail,
        messageId: result.messageId,
      });
    } catch (error) {
      console.error('❌ Failed to send login email', {
        to: recipientEmail,
        error,
      });
    }
  }
}
