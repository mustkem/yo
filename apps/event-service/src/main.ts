import { NestFactory } from '@nestjs/core';
import { EventServiceModule } from './event-service.module';
// no HTTP port, runs as a background worker
async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(EventServiceModule);

  // If you have any `onModuleInit()` logic in your services, it will be triggered automatically.

  // Keep the process running
  console.log('✅ EventService is running');
}
bootstrap();
