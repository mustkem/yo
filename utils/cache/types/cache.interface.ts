import { CacheResult, CacheResults } from './cacheResult'

export interface Cache<K, V> {
  getOne(key: K): Promise<CacheResult<V>>
  getOneOrFail(key: K): Promise<V>
  getMany(keys: readonly K[]): Promise<CacheResults<K, V>>

  setOne(key: K, value: V): Promise<void>
  setMany(items: Map<K, V>): Promise<void>
}
