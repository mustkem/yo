import { HybridCache, HybridCacheOptions } from './hybridCache';

export abstract class HybridCacheWithAll<V> extends HybridCache<V> {
  private idsCache: HybridCache<string[]>;
  private readonly idsCacheKey = 'ALL';

  constructor(options: HybridCacheOptions<V>) {
    super(options);

    // Create internal cache for IDs with different namespace and proper typing
    const idsOptions: HybridCacheOptions<string[]> = {
      namespace: `${options.namespace}Ids`,
      config: options.config,
      lruConfig: { max: 1 }, // Only storing 'All' key
      memoryTtl:
        typeof options.memoryTtl === 'number'
          ? options.memoryTtl + 30 // Adding some buffer since ids don't update as frequently
          : undefined,
      redisConnection: options.redisConnection,
      redisTtl:
        typeof options.redisTtl === 'number'
          ? options.redisTtl + 30 // Adding some buffer since ids don't update as frequently
          : undefined,
    };

    this.idsCache = new (class extends HybridCache<string[]> {
      protected async fetch(): Promise<Map<string, string[]> | null> {
        return null; // IDs cache doesn't fetch independently
      }
    })(idsOptions);
  }

  /**
   * Gets all entities by first fetching IDs from the IDs cache,
   * then using getMany to fetch all entities
   */
  public async getAll(): Promise<V[]> {
    const idsResult = await this.idsCache.getOne(this.idsCacheKey);

    const entitiesResult = await this.getMany(idsResult ?? []);
    return Array.from(entitiesResult.hits.values());
  }

  /**
   * Abstract method that subclasses must implement to fetch all entities
   * Should return both entities map and IDs array
   */
  protected abstract fetchAll(): Promise<{
    entities: Map<string, V>;
    ids: string[];
  } | null>;

  /**
   * Override fetch to handle both individual keys and bulk fetching
   */
  protected async fetch(
    keys?: readonly string[],
    useWriter = false,
  ): Promise<Map<string, V> | null> {
    console.log('HybridCacheWithAll fetch called with keys:', keys);

    if (!keys || !keys.length) {
      // Fetch all - populate both entity cache and IDs cache
      const result = await this.fetchAll();
      if (!result) return null;

      // Cache the IDs in the IDs cache
      await this.idsCache.setOne(this.idsCacheKey, result.ids);

      return result.entities;
    } else {
      // Fetch specific keys - delegate to subclass
      return this.fetchSpecific(keys, useWriter);
    }
  }

  /**
   * Abstract method for fetching specific entities by keys
   * Subclasses can implement this for efficient individual entity fetching
   */
  protected abstract fetchSpecific(
    keys: readonly string[],
    useWriter?: boolean,
  ): Promise<Map<string, V> | null>;

  /**
   * Force refresh both entity cache and IDs cache
   */
  public async recacheAll(useWriter = false): Promise<void> {
    // Recache all entities (this will also refresh IDs cache via fetch)
    await super.recacheAll(useWriter);
  }

  /**
   * Get the IDs cache for advanced operations if needed
   */
  protected getIdsCache(): HybridCache<string[]> {
    return this.idsCache;
  }
}
