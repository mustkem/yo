const level = process.env.DEBUG || 'warn'
const isDebug = ['debug', 'silly'].includes(level)
const onValues: (string | undefined)[] = ['1', 'on']

export const log = {
  level,
  isDebug,
  isDbDebug: isDebug && onValues.includes(process.env.LOG_DB),
  isCacheDebug: isDebug && onValues.includes(process.env.LOG_CACHE),
  isRedisDebug: isDebug && onValues.includes(process.env.LOG_REDIS),
}
