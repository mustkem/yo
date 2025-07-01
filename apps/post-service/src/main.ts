import { NestFactory } from '@nestjs/core';
import { PostServiceModule } from './post-service.module';

async function bootstrap() {
  const app = await NestFactory.create(PostServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
