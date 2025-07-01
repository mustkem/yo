import { Module } from '@nestjs/common';
import { PostServiceController } from './post-service.controller';
import { PostServiceService } from './post-service.service';

@Module({
  imports: [],
  controllers: [PostServiceController],
  providers: [PostServiceService],
})
export class PostServiceModule {}
