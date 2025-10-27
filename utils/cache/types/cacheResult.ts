import { CacheMissCount } from './cacheLog'

// cached value or undefined if key is not found in cache or fetched
export type CacheResult<V> = V | undefined

export interface CacheResults<K, V> {
  hits: Map<K, V> // Map of found and/or fetched keys
  misses: K[] // keys that are not found in cache or fetched
}

// internal result that has miss info broken by source kind (memory, redis, fetch...)
export interface CacheResultsWithMissCount<K, V> extends CacheResults<K, V> {
  missCount: CacheMissCount
}
