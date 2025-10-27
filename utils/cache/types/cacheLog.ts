export interface CacheMissCount {
  fetch?: number
  memory?: number
  redis?: number
}

export interface CacheLogData {
  namespace: string
  action?: string
  getCount?: number
  recacheCount?: number
  missCount: CacheMissCount
}

export interface CacheCounterNamespace extends CacheLogData {
  queryCount: number
}
