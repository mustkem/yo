// interface for global cache configuration
export interface CacheConfig {
  isEnabled: boolean
  logDebug: boolean
  logUsage: boolean
  // number of ms to wait before usage log is flushed
  throttleUsageLog: number
}
