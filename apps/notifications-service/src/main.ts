import { NestFactory } from '@nestjs/core';
import { NotificationsServiceModule } from './notifications-service.module';
// no HTTP port, runs as a background worker
async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(
    NotificationsServiceModule,
  );

  // Optional: grab the service and start listening to events or Kafka consumers, etc.
  const notificationsService = appContext.get('NotificationsService');

  // If you have any `onModuleInit()` logic in your services, it will be triggered automatically.

  // Keep the process running
  console.log('✅ Notifications Service is running');
}
bootstrap();
