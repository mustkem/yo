import { isFunction, isUndefined } from 'lodash';
import { PromiseAggregator } from '../promiseAggregator';
import {
  Cache,
  CacheFetchNotDefined,
  CacheKeyNotFoundError,
  CacheLogData,
  CacheMissCount,
  CacheResult,
  CacheResults,
  CacheResultsWithMissCount,
  CacheTtl,
} from './types';
import { CacheConfig } from './types/cacheConfig.interface';
import { CacheOptions } from './types/cacheOptions';

export abstract class BaseCache<V> implements Cache<string, V> {
  public readonly namespace: string;
  protected defaultTtl?: CacheTtl<string, V>;
  protected config: CacheConfig;
  private aggregator: PromiseAggregator;

  constructor(options: CacheOptions<string, V>) {
    this.namespace = options.namespace;
    this.defaultTtl = options.defaultTtl;
    this.config = options.config;

    this.aggregator = new PromiseAggregator();
  }

  /**
   * Reads key from cache. If missing, tries to fetch and cache it
   * @param key
   * @returns
   */
  public async getOne(key: string): Promise<CacheResult<V>> {
    console.log('Getting one key from cache:', key);
    const { hits } = await this.getMany([key]);
    return hits.get(key);
  }

  /**
   * Reads key from cache. If missing, tries to fetch and cache it.
   * Throws if key is not read or fetched
   * @param key
   * @returns
   */
  public async getOneOrFail(key: string): Promise<V> {
    const result = await this.getOne(key);

    if (result === undefined) {
      throw new CacheKeyNotFoundError(key);
    }

    return result;
  }

  /**
   * Reads keys from cache. Tries to fetch and cache missing keys.
   * This call is aggregated.
   * @param keys
   * @returns
   */
  public async getMany(
    keys: readonly string[],
  ): Promise<CacheResults<string, V>> {
    console.log('Getting many keys from cache:', keys);

    const aggregateKey = Array.from(keys).sort().join('+');
    return this.aggregator.execute(`GET:${aggregateKey}`, () =>
      this.executeGetMany(keys),
    );
  }

  /**
   * Reads key from cache
   * @param key
   * @returns
   */
  public async peekOne(key: string): Promise<CacheResult<V>> {
    const { hits } = await this.peekMany([key]);
    return hits.get(key);
  }

  /**
   * Reads key from cache.
   * Throws if key is not cached
   * @param key
   * @returns
   */
  public async peekOneOrFail(key: string): Promise<V> {
    const result = await this.peekOne(key);

    if (result === undefined) {
      throw new CacheKeyNotFoundError(key);
    }

    return result;
  }

  /**
   * Reads keys from cache.
   * This call is aggregated.
   * @param keys
   * @returns
   */
  public async peekMany(
    keys: readonly string[],
  ): Promise<CacheResults<string, V>> {
    const aggregateKey = Array.from(keys).sort().join('+');
    return this.aggregator.execute(`PEEK:${aggregateKey}`, () =>
      this.executeGetMany(keys, false),
    );
  }

  /**
   * Reads keys from cache. Tries to fetch and cache missing keys
   * @param keys
   * @returns
   */
  private async executeGetMany(
    keys: readonly string[],
    fetchIfMissing = true,
  ): Promise<CacheResults<string, V>> {
    if (this.config.isEnabled) {
      // read from cache
      const { hits, misses, missCount } = await this.readFromCache(keys);
      let fetchMisses: string[] | null = null;
      let fetchHitsCount = 0;

      if (misses.length && fetchIfMissing) {
        // try to fetch missing keys, if fetch method is provided
        const fetchHits = await this.fetch(misses);

        if (fetchHits) {
          if (fetchHits.size) {
            // cache fetched keys and update results
            await this.setMany(fetchHits);
            fetchHits.forEach((value, key) => hits.set(key, value));
            fetchHitsCount = fetchHits.size;
          }

          fetchMisses = misses.filter((miss) => !fetchHits.has(miss));
          missCount.fetch = fetchMisses.length;
        }
      }

      this.log({
        namespace: this.namespace,
        action: 'executeGetMany',
        getCount: keys.length,
        recacheCount: fetchHitsCount, // Number of keys fetched and cached
        missCount,
      });

      return { hits, misses: fetchMisses ?? misses };
    } else {
      console.log('Cache is disabled, fetching all keys directly:', keys);

      const fetchHits = await this.fetch(keys);
      if (fetchHits) {
        return {
          hits: fetchHits,
          misses: keys.filter((k) => !fetchHits.has(k)),
        };
      } else {
        return { hits: new Map(), misses: [...keys] };
      }
    }
  }

  /**
   * Writes one key/value pair to cache
   * @param key
   * @param value
   */
  public async setOne(key: string, value: V): Promise<void> {
    if (this.config.isEnabled) {
      await this.writeToCache(new Map([[key, value]]));
    }
  }

  /**
   * Writes key/value map to cache (key at a time)
   * @param items
   */
  public async setMany(items: Map<string, V>): Promise<void> {
    if (this.config.isEnabled) {
      await this.writeToCache(items);
    }
  }

  /**
   * Deletes single key from cache
   * @param key
   * @returns
   */
  public async deleteOne(key: string): Promise<void> {
    return this.deleteMany([key]);
  }

  /**
   * Deletes keys from cache
   * @param keys
   * @returns
   */
  public async deleteMany(keys: readonly string[]): Promise<void> {
    if (this.config.isEnabled) {
      return this.deleteFromCache(keys);
    }
  }

  /**
   * Force fetch and cache. Existing cache will be overwritten
   * @param keys
   */
  public async recacheMany(keys: readonly string[], useWriter = false) {
    if (!this.config.isEnabled) {
      return;
    }

    const fetchHits = await this.fetch(keys, useWriter);

    if (!fetchHits) {
      throw new CacheFetchNotDefined();
    }

    if (fetchHits.size) {
      await this.setMany(fetchHits);
    }

    const missCount: CacheMissCount = {};
    if (keys.length > fetchHits.size) {
      missCount.fetch = keys.length - fetchHits.size;
    }

    this.log({
      namespace: this.namespace,
      action: 'recacheMany',
      recacheCount: keys.length,
      missCount,
    });
  }

  /**
   * Force fetch and cache all available keys. Existing cache will be overwritten.
   * Use this method when you need to refresh the cache for all keys in the system.
   * @param useWriter - Whether to use the writer function for fetching data.
   * Note: The `fetch` method will be called with `undefined` for the keys parameter,
   * which should be handled to fetch all keys.
   */
  public async recacheAll(useWriter = false) {
    if (!this.config.isEnabled) {
      return;
    }

    const fetchHits = await this.fetch(undefined, useWriter);

    if (!fetchHits) {
      throw new CacheFetchNotDefined();
    }

    if (fetchHits.size) {
      await this.setMany(fetchHits);
    }

    this.log({
      namespace: this.namespace,
      action: 'recacheAll',
      recacheCount: fetchHits.size,
      missCount: {},
    });
  }

  /**
   * Abstract virtual method that implements cache reads
   * @param keys
   */
  protected abstract readFromCache(
    keys: readonly string[],
  ): Promise<CacheResultsWithMissCount<string, V>>;

  /**
   * Abstract virtual method that implements cache writes
   * @param keys
   */
  protected abstract writeToCache(items: Map<string, V>): Promise<void>;

  /**
   * Abstract virtual method that implements cache delete
   * @param keys
   */
  protected abstract deleteFromCache(keys: readonly string[]): Promise<void>;

  /**
   * Returns TTL number for specific key/value
   * @param key
   * @param value
   * @returns
   */
  protected resolveTtl(key: string, value: V): number | undefined {
    const ttl = this.defaultTtl;

    if (typeof ttl === 'function') {
      // Cast to the expected function signature so TypeScript accepts the call
      return (
        ttl as (namespace: string, key: string, value: V) => number | undefined
      )(this.namespace, key, value);
    }

    return ttl as number | undefined;
  }

  /**
   * Count cache usage and writes debug log (if enabled)
   * @param data
   */
  protected log(data: CacheLogData) {
    if (isUndefined(data.getCount) && isUndefined(data.recacheCount)) {
      throw new Error('CacheLogData has no count');
    }

    if (this.config.logUsage) {
      console.log(data);
    }

    if (this.config.logDebug) {
      console.debug(`Cache:${data.namespace}`, data);
    }
  }

  /**
   * Fetch key values from outside source (like db or remote service)
   * Usually implemented in service that provides cache
   * @param keys
   * @param useWriter connection
   * @returns
   */
  protected async fetch(
    keys?: readonly string[],
    useWriter = false,
  ): Promise<Map<string, V> | null> {
    // by default, fetch is not defined
    return null;
  }
}
