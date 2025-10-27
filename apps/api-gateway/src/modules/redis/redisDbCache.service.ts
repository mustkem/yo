import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { redis as redisOptions } from '../../config/redis';
import { RedisConnection } from './utils/redisConnection';

@Injectable()
export class RedisDbCacheService extends RedisConnection {
  constructor() {
    super(
      'dbCache',
      redisOptions.dbCacheConnectionURI,
      redisOptions.dbCacheConnectionOptions,
    );
  }
}
