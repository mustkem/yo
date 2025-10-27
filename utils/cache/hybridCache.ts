import {
  Cache,
  CacheMissCount,
  CacheResultsWithMissCount,
  CacheTtl,
} from './types'
import { BaseCache } from './baseCache'
import { MemoryCache, MemoryCacheOptions } from './memoryCache'
import { RedisCache, RedisCacheOptions } from './redisCache'

export interface HybridCacheOptions<V>
  extends MemoryCacheOptions<string, V>,
    RedisCacheOptions<V> {
  memoryTtl?: CacheTtl<string, V>
  redisTtl?: CacheTtl<string, V>
}

export class HybridCache<V> extends BaseCache<V> implements Cache<string, V> {
  private memoryCache: MemoryCache<V>
  private redisCache: RedisCache<V>

  constructor(options: HybridCacheOptions<V>) {
    super(options)

    this.memoryCache = new MemoryCache<V>({
      ...options,
      defaultTtl: options.memoryTtl ?? options.defaultTtl,
      config: {
        ...options.config,
        logUsage: false,
      },
    })
    this.redisCache = new RedisCache<V>({
      ...options,
      defaultTtl: options.redisTtl ?? options.defaultTtl,
      config: {
        ...options.config,
        logUsage: false,
      },
    })
  }

  protected async readFromCache(
    keys: readonly string[]
  ): Promise<CacheResultsWithMissCount<string, V>> {
    // try memory first
    const { hits, misses } = await this.memoryCache.getMany(keys)
    const missCount: CacheMissCount = { memory: misses.length }

    if (misses.length === 0) {
      return { hits, misses, missCount: missCount }
    }

    // try redis for missing
    const redisResult = await this.redisCache.getMany(misses)
    missCount.redis = redisResult.misses.length

    // set cache memory
    this.memoryCache.setMany(redisResult.hits)

    // merge and return
    redisResult.hits.forEach((value, key) => hits.set(key, value))
    return { hits, misses: redisResult.misses, missCount: missCount }
  }

  protected async writeToCache(items: Map<string, V>) {
    this.memoryCache.setMany(items)
    return this.redisCache.setMany(items)
  }

  protected async deleteFromCache(keys: readonly string[]): Promise<void> {
    this.memoryCache.deleteMany(keys)
    return this.redisCache.deleteMany(keys)
  }
}
