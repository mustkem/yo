import { OnApplicationShutdown } from '@nestjs/common';
import {
  RedisClientType,
  RedisConnectionOptions,
} from 'apps/api-gateway/src/config/redis';
import { Cluster, Redis } from 'ioredis';

export class RedisConnection implements OnApplicationShutdown {
  public readonly connection: Redis | Cluster;
  public readonly type: RedisClientType;
  constructor(
    protected name: string,
    connectionURI: string,
    options: RedisConnectionOptions,
  ) {
    this.type = options.type;
    switch (this.type) {
      case 'ioredis':
        if (!connectionURI) {
          throw new Error(
            'invalid redis configuration: missing redis connection uri',
          );
        }
        if (!options.redisOptions) {
          throw new Error('invalid redis configuration: missing redis options');
        }
        this.connection = new Redis(connectionURI);
        this.connection.options = {
          ...this.connection.options,
          ...options.redisOptions,
        };
        break;
      case 'ioredis/cluster':
        if (!options.clusterOptions) {
          throw new Error(
            'invalid redis configuration: missing cluster options',
          );
        }
        this.connection = new Cluster(
          options.clusterOptions.nodes,
          options.clusterOptions.options,
        );
        break;
      default:
        throw new Error('invalid redis configuration: invalid connection type');
    }
    this.connection.on('error', this.errorLogger);
  }

  async onApplicationShutdown() {
    console.log(`Shutting down redis connection: ${this.name}`);
    await this.connection.quit();
  }

  private errorLogger = (error: any) => {
    console.error(`Redis '${this.name}' connection service error`, {
      error,
    });
  };
}
