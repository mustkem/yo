export class CacheKeyNotFoundError<K> extends Error {
  name = 'CacheKeyNotFoundError'

  constructor(key: K) {
    super(`Cache key '${key}' is not found`)
  }
}

export class CacheFetchNotDefined extends Error {
  name = 'CacheFetchNotDefined'

  constructor() {
    super(`Cache doesn't have fetch defined`)
  }
}

export class MemoryCacheSizeError extends Error {
  name = 'MemoryCacheSizeError'

  constructor() {
    super('MemoryCache size can not be unlimited')
  }
}

export class RedisCacheGetPipelineError<K> extends Error {
  name = 'RedisCacheGetPipelineError'

  constructor(key: K, error: any) {
    super(`RedisCache get pipeline error for key '${key}': '${error}`)
  }
}

export class RedisCacheSetPipelineError<K> extends Error {
  name = 'RedisCacheSetPipelineError'

  constructor(key: K, error: any) {
    super(`RedisCache set pipeline error for key '${key}': '${error}`)
  }
}

export class RedisCacheTtlError<K> extends Error {
  name = 'RedisCacheTtlError'

  constructor(key: K) {
    super(`RedisCache TTL not set for '${key}'`)
  }
}
