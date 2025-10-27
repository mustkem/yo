import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisDbCacheService } from './redisDbCache.service';

@Module({
  imports: [],
  providers: [RedisService, RedisDbCacheService],
  exports: [RedisService, RedisDbCacheService],
})
export class RedisModule {}
