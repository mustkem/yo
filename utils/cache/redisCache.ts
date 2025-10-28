import { Cluster, Redis } from 'ioredis';
import { isString } from 'lodash';
import { BaseCache } from './baseCache';
import {
  Cache,
  CacheResultsWithMissCount,
  RedisCacheGetPipelineError,
  RedisCacheSetPipelineError,
  RedisCacheTtlError,
} from './types';
import { CacheOptions, MaterializeCallback } from './types/cacheOptions';
import { RedisConnection } from 'apps/api-gateway/src/modules/redis/utils/redisConnection';

export interface RedisCacheOptions<V> extends CacheOptions<string, V> {
  redisConnection: RedisConnection;
  redisMaterialize?: MaterializeCallback<V>;
}

export class RedisCache<V> extends BaseCache<V> implements Cache<string, V> {
  private redis: Redis | Cluster;
  private materializeCallback?: MaterializeCallback<V>;

  constructor(options: RedisCacheOptions<V>) {
    super(options);
    this.redis = options.redisConnection.connection;
    this.materializeCallback = options.redisMaterialize;
  }

  protected makeKey(key: string): string {
    // The "{}" wraping the namespace will force the redis cluster to store all keys from the same namespace in the same hash slot on the same cluster node.
    // This will ensure that the pipeline will be able to fetch all of the keys successfully.
    // See Redis Cluster data sharding @ https://redis.io/topics/cluster-tutorial
    return `Cache:{${this.namespace}}:${key}`;
  }

  protected async readFromCache(
    keys: readonly string[],
  ): Promise<CacheResultsWithMissCount<string, V>> {
    console.log('RedisCache readFromCache called with keys:', keys);

    const hits = new Map<string, V>();
    const misses: string[] = [];

    if (keys.length === 0) {
      return { hits, misses, missCount: { redis: 0 } };
    }

    // provided by ioredis, not something defined in the project.
    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      // That line queues a GET command on the Redis pipeline for the key built by makeKey(key). Because pipeline is an ioredis Pipeline instance, calling get(...) doesn’t hit Redis immediately—it simply appends GET <namespace:key> to the batched command list. When the code later calls pipeline.exec(), ioredis sends all queued commands in one roundtrip and returns the list of results.
      pipeline.get(this.makeKey(key));
    }
    const values = await pipeline.exec();

    console.log('RedisCache pipeline exec returned values:', values);

    // throw if unexpected result was received
    if (!values || values.length !== keys.length) {
      throw new RedisCacheGetPipelineError(
        'N/A',
        `Expected values.length was ${keys.length} but ${
          values?.length ?? 0
        } received`,
      );
    }

    // throw if error is received
    const errorIndex = values?.findIndex(([error]) => !!error) ?? -1;
    if (errorIndex >= 0) {
      throw new RedisCacheGetPipelineError(
        keys[errorIndex],
        values[errorIndex][0],
      );
    }

    // map results
    for (const i in keys) {
      const [, value] = values[i];
      if (isString(value)) {
        // we assume that all values are `JSON.stringified`
        // TODO: some kind of validation that object is indeed what we expect?
        hits.set(keys[i], this.materialize(JSON.parse(value as string)));
      } else {
        misses.push(keys[i]);
      }
    }

    console.log('RedisCache readFromCache hits:', hits, 'misses:', misses);

    return { hits, misses, missCount: { redis: misses.length } };
  }

  /**
   * Optionally performs additional cache de-serialization step
   * @param cachedValue
   * @returns
   */
  protected materialize(cachedValue: any): V {
    return this.materializeCallback
      ? this.materializeCallback(cachedValue)
      : cachedValue;
  }

  protected async writeToCache(items: Map<string, V>) {
    if (!items.size) {
      return;
    }

    // build pipeline commands
    const pipeline = this.redis.pipeline();
    for (const [key, value] of items) {
      const itemTtl = this.resolveTtl(key, value);
      if (!itemTtl || itemTtl <= 0) {
        throw new RedisCacheTtlError(key);
      }
      pipeline.set(this.makeKey(key), JSON.stringify(value), 'EX', itemTtl);
    }

    const result = await pipeline.exec();
    if (result?.length !== items.size) {
      throw new RedisCacheSetPipelineError(
        'N/A',
        `Expected result.length was ${items.size} but ${
          result?.length ?? 0
        } received`,
      );
    }

    const errorIndex =
      result?.findIndex(([error, message]) => !!error || message !== 'OK') ??
      -1;
    if (result && errorIndex >= 0) {
      throw new RedisCacheSetPipelineError(
        Array.from(items.keys())[errorIndex],
        `${result[errorIndex][0]} (message: ${result[errorIndex][1]})`,
      );
    }
  }

  protected async deleteFromCache(keys: readonly string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    await this.redis.del(keys.map((key) => this.makeKey(key)));
  }

  public async executeLua(script: string, keys: string[], args: any[]) {
    return this.redis.eval(
      script,
      keys.length,
      ...keys.map((key) => this.makeKey(key)),
      ...args,
    );
  }
}
