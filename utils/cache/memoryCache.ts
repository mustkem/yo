import { LRUCache } from 'lru-cache';
import {
  Cache,
  CacheResultsWithMissCount,
  MemoryCacheSizeError,
} from './types';
import { BaseCache } from './baseCache';
import { CacheOptions } from './types/cacheOptions';

/**
 * MemoryCacheOptions defines configuration options for in-memory cache.
 *
 * The LRUCache requires at least one limiting property:
 * - `max`: maximum number of entries (count-based limit)
 * - `maxSize` + `sizeCalculation`: total computed size limit
 * - `ttl` (with `ttlAutopurge: true`): time-based limit
 *
 * Safe examples:
 * ```ts
 * // 1. Limit by entry count
 * new LRUCache({ max: 500 });
 *
 * // 2. Limit by total size
 * new LRUCache({
 *   maxSize: 10000,
 *   sizeCalculation: (v, k) => JSON.stringify(v).length,
 * });
 *
 * // 3. Limit by TTL only
 * new LRUCache({
 *   ttl: 60_000,
 *   ttlAutopurge: true,
 * });
 *
 * // 4. Combined strategy
 * new LRUCache({
 *   max: 500,
 *   ttl: 60_000,
 * });
 * ```
 */
export interface MemoryCacheOptions<K, V> extends CacheOptions<K, V> {
  lruConfig: LRUCache.Options<K, V, unknown>;
}

/**
 * MemoryCache provides an in-memory caching layer using LRU strategy.
 * Supports TTL expiration and size/entry limits.
 */
export class MemoryCache<V> extends BaseCache<V> implements Cache<string, V> {
  private cache: LRUCache<string, V, unknown>;

  constructor(options: MemoryCacheOptions<string, V>) {
    super(options);

    // Validate configuration to ensure at least one limiting property
    const config = options.lruConfig;
    const hasLimit =
      config.max !== undefined ||
      config.maxSize !== undefined ||
      config.ttl !== undefined;
    if (!hasLimit) {
      throw new MemoryCacheSizeError();
    }

    // Initialize the LRUCache with provided configuration
    this.cache = new LRUCache<string, V, unknown>(options.lruConfig);
  }

  /**
   * Reads multiple keys from the cache.
   * Returns hits, misses, and miss counts for memory cache.
   */
  protected async readFromCache(
    keys: readonly string[],
  ): Promise<CacheResultsWithMissCount<string, V>> {
    const hits = new Map<string, V>();
    const misses: string[] = [];

    for (const key of keys) {
      const value = this.cache.get(key);
      if (value === undefined) {
        misses.push(key);
      } else {
        hits.set(key, value);
      }
    }

    return { hits, misses, missCount: { memory: misses.length } };
  }

  /**
   * Writes a batch of key-value pairs to the cache.
   */
  protected async writeToCache(items: Map<string, V>) {
    for (const [key, value] of items) {
      const entryTtl = this.resolveTtl(key, value);
      this.cache.set(
        key,
        value,
        entryTtl ? { ttl: entryTtl * 1000 } : undefined,
      );
    }
  }

  /**
   * Deletes a batch of keys from the cache.
   */
  protected async deleteFromCache(keys: readonly string[]): Promise<void> {
    for (const key of keys) {
      this.cache.delete(key);
    }
  }
}
