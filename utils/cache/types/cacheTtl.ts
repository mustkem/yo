/**
 * Returns TTL in seconds
 */
export type CacheTtlHook<K, V> = (
  cacheName: string,
  key: K,
  value: V
) => number | undefined

/**
 * TTL in seconds
 */
export type CacheTtl<K, V> = number | CacheTtlHook<K, V>
