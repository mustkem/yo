import { RedisDbCacheService } from 'apps/api-gateway/src/modules/redis/redisDbCache.service';
import { createHmac } from 'crypto';
import { isArray } from 'lodash';
import { QueryRunner } from 'typeorm';
import { QueryResultCacheOptions } from 'typeorm/cache/QueryResultCacheOptions';
import { RedisQueryResultCache } from 'typeorm/cache/RedisQueryResultCache';
import { Connection } from 'typeorm/connection/Connection';

/**
 * This is extension of TypeORM RedisQueryResultCache
 * - It doesn't open new Redis connection but use our Redis service
 * - It logs cache key usage and db fetch duration
 */
export class TypeOrmRedisCache extends RedisQueryResultCache {
  constructor(
    protected typeOrmConnection: Connection,
    protected redisConnection: RedisDbCacheService,
  ) {
    super(typeOrmConnection, redisConnection.type);
  }

  async connect(): Promise<void> {
    // inject our service
    this.client = this.redisConnection.connection;
  }

  async disconnect(): Promise<void> {
    // remove our service
    this.client = undefined;
  }

  /**
   * Clears everything stored in the cache.
   */
  async clear(queryRunner?: QueryRunner) {
    // don't
  }

  async getFromCache(
    options: QueryResultCacheOptions,
    queryRunner?: QueryRunner,
  ): Promise<QueryResultCacheOptions | undefined> {
    const value = await super.getFromCache(options, queryRunner);

    // log cache hit
    if (value !== null) {
      this.log(options, false, false);
    }

    return value;
  }

  async storeInCache(
    options: QueryResultCacheOptions,
    savedCache: QueryResultCacheOptions,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    await super.storeInCache(options, savedCache, queryRunner);

    // we are here because getFromCache returned null (fetchMiss)
    // check if fetch returned anything and log result
    const fetchMiss =
      options.result === null ||
      (isArray(options.result) && options.result.length === 0);
    this.log(options, true, fetchMiss);
  }

  async remove(
    identifiers: string[],
    queryRunner?: QueryRunner,
  ): Promise<void> {
    if (this.redisConnection.connection.status !== 'ready') {
      await this.redisConnection.connection.connect(async () => {
        await super.remove(identifiers, queryRunner);
      });
    } else {
      await super.remove(identifiers, queryRunner);
    }
  }

  private log(
    options: QueryResultCacheOptions,
    cacheMiss = false,
    fetchMiss = false,
  ) {
    const key = options.identifier
      ? options.identifier.split(':')[0]
      : createHmac('md5', 'typeOrm')
          .update(options.query.split('-- PARAMETERS:')[0].trim())
          .digest('hex');

    console.log({
      namespace: `TypeORM.${key}`,
      getCount: 1,
      missCount: {
        redis: cacheMiss ? 1 : 0,
        fetch: fetchMiss ? 1 : 0,
      },
    });
  }
}
