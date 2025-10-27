import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { PostCacheService } from './post.cache.service';

@Module({
  imports: [RedisModule],
  providers: [PostCacheService, PostCacheService],
  exports: [PostCacheService],
})
export class PostCacheModule {}
