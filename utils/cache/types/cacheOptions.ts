import { CacheConfig } from './cacheConfig.interface';
import { CacheTtl } from './cacheTtl';

export type MaterializeCallback<V> = (cachedValue: any) => V;

export interface CacheOptions<K, V> {
  namespace: string;
  defaultTtl?: CacheTtl<K, V>;
  config: CacheConfig;
}
