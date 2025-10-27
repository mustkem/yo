import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';
import { env } from './env';
import { log } from './log';

export type RedisClientType = 'ioredis' | 'ioredis/cluster';
const connectionURI = process.env.REDIS_URI || 'redis://localhost:6379';

const connectionOptions: RedisOptions = {
  reconnectOnError: (error: Error) => {
    if (error.message.includes('ETIMEDOUT')) {
      return true;
    }
    return false;
  },
};

export interface RedisConnectionOptions {
  type: RedisClientType;
  clusterOptions?: {
    nodes: ClusterNode[];
    options: ClusterOptions;
  };
  redisOptions?: RedisOptions;
}

const dbCacheConnectionURI =
  process.env.DB_REDIS_URI || 'redis://localhost:6379';

const dbCacheRedisConnectionOptions: RedisConnectionOptions = {
  type: 'ioredis',
  redisOptions: {
    reconnectOnError: (error: Error) => {
      if (error.message.includes('ETIMEDOUT')) {
        return true;
      }
      return false;
    },
  },
};

const queueConnectionURI =
  process.env.QUEUE_REDIS_URI || 'redis://localhost:6379';

const queueConnectionOptions: RedisOptions = {
  reconnectOnError: (error: Error) => {
    if (error.message.includes('ETIMEDOUT')) {
      return true;
    }
    return false;
  },
};

export const redis = {
  connectionURI,
  connectionOptions,
  dbCacheConnectionURI,
  dbCacheConnectionOptions: dbCacheRedisConnectionOptions,
  queueConnectionURI,
  queueConnectionOptions,
  disableRedisLoaders: true,
  // disableRedis: process.env.DISABLE_REDIS === 'true' ? true : false,
  // In seconds
  defaultRedisLoaderExpire: process.env.REDIS_EXPIRE
    ? parseInt(process.env.REDIS_EXPIRE, undefined)
    : 60 * 60 * 24,
  // expiry time for the two factor authentication redis key
  defaultRedisTwoFactorKeyExpire: 120,
  keyPrefixes: {
    // The connect-redis library does not add ":"
    auth: {
      sessionBase: 'authSessionBase:',
      sessionWeb: 'authSessionWeb:',
      sessionMobile: 'authSessionMobile:',
      sessionLocal: 'authSessionLocal:',
      userSession: (sessionId: string, domain: string) =>
        `authSession${domain}:${sessionId}`,
      sessionIds: (userId: string) => `authSession:ids:${userId}`,
    },
  },
  debug: env.isProduction || env.isStaging ? false : log.isRedisDebug,
};
