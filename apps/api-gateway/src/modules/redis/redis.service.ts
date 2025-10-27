import { EventEmitter } from 'events';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';
import { redis as redisConfig } from '../../config/redis';

export interface SortedSetMember {
  member: string;
  score: number;
}

declare module 'ioredis' {
  interface RedisCommander<Context> {}
}

@Injectable()
export class RedisService implements OnApplicationShutdown {
  public client: Redis;
  private monitor: EventEmitter;

  constructor() {
    // @ts-ignore: WORKAROUND for defineCommand https://github.com/luin/ioredis/issues/806
    this.client = new Redis(redisConfig.connectionURI);
    this.client.options = {
      ...this.client.options,
      ...redisConfig.connectionOptions,
    };

    this.client.on('error', this.errorLogger);
    // Useful for debugging redis
    if (redisConfig.debug) {
      this.client.on('connect', this.connectLogger);
      this.client.monitor().then((monitor) => {
        this.monitor = monitor;
        this.monitor.on('monitor', this.monitorLogger);
      });
    }
  }

  async onApplicationShutdown() {
    console.log('Shutting down redis connection');
    await this.client.quit();
  }

  private connectLogger = () => {
    console.log('Redis connected');
  };

  private errorLogger = (error: any) => {
    console.error('Redis error', { error });
  };

  private monitorLogger = (
    time: unknown,
    args: unknown,
    source: unknown,
    database: unknown,
  ) => {
    console.log({
      message: 'redis operation',
      time,
      args,
      source,
      database,
    });
  };

  public async health() {
    const ping = await this.client.ping('Health Check');
    return ping === 'Health Check';
  }

  public async get(key: string) {
    return this.client.get(key);
  }

  public async exists(key: string) {
    return this.client.exists(key);
  }

  public async set(key: string, value: string | number, expire?: number) {
    console.log('Redis set', { key, value, expire });
    return expire
      ? this.client.set(key, value, 'EX', expire)
      : this.client.set(key, value);
  }

  public async setIfNotExists(
    key: string,
    value: string | number,
    expire?: number,
  ) {
    console.log('Redis set if not exists', { key, value, expire });
    return expire
      ? this.client.set(key, value, 'EX', expire, 'NX')
      : this.client.set(key, value, 'NX');
  }

  public async delete(key: string) {
    console.log('Redis delete', { key });
    return this.client.del(key);
  }

  public async deleteMany(keys: string[]) {
    console.log('Redis delete many', { keys });
    return this.client.del(keys);
  }

  public async resetNonce() {
    // match nonce and nonce lock
    const scanStream = this.client.scanStream({ match: 'omiTransfer:nonce*' });
    scanStream.on('data', async (keys) => {
      for (const key of keys) {
        await this.delete(key);
      }
    });
    return new Promise((resolve, reject) => {
      scanStream.on('end', () => {
        resolve(true);
      });
      scanStream.on('error', (error) => {
        reject(error);
      });
    });
  }

  public async scan(match: string, count = 10000): Promise<string[]> {
    const stream = this.client.scanStream({ match: `${match}:*`, count });
    const scannedKeysMap: { [key: string]: boolean } = {};

    return new Promise((resolve, reject) => {
      stream.on('data', (keys) => {
        for (const key of keys) {
          if (key) {
            scannedKeysMap[key] = true;
          }
        }
      });
      stream.on('end', function () {
        resolve(Object.keys(scannedKeysMap));
      });
      stream.on('error', function (err) {
        reject(err);
      });
    });
  }

  public async getSetMembers(key: string) {
    console.log('Redis getAllSet', { key });
    return this.client.smembers(key);
  }

  public async isSetMember(key: string, value: string) {
    console.log('Redis getSetMember', { key, value });
    return this.client.sismember(key, value);
  }

  public async deleteSetMembers(key: string, values: string[]) {
    console.log('Redis deleteSetMember', { key, values });
    return this.client.srem(key, values);
  }

  public async addSetMembers(key: string, values: string[]) {
    console.log('Redis addSetMember', { key, values });
    return this.client.sadd(key, values);
  }

  public async setHashField(
    key: string,
    field: string,
    value: number | string,
    expire?: number,
  ) {
    console.log('Redis setHashField', { key, field, value });

    await this.client.hset(key, field, value);
    if (expire) {
      await this.client.expire(key, expire);
    }
  }

  public async increaseHashField(key: string, field: string, value: number) {
    console.log('Redis increaseHashField', { key, field, value });
    return this.client.hincrbyfloat(key, field, value);
  }

  public async getHashField(key: string, field: string) {
    console.log('Redis getHashField', { key, field });
    return this.client.hget(key, field);
  }

  public async getHashFields(key: string) {
    console.log('Redis getHashFields', { key });
    return this.client.hgetall(key);
  }

  public async getHashLength(key: string) {
    console.log('Redis getHashLength', { key });
    return this.client.hlen(key);
  }

  public async deleteHashField(key: string, field: string) {
    console.log('Redis deleteHashField', { key, field });
    return this.client.hdel(key, field);
  }

  public async getSetMembersCount(key: string) {
    console.log('Redis getSetMembersCount', { key });
    return this.client.scard(key);
  }

  public async addSortedSetMember(key: string, score: number, member: string) {
    console.log('Redis addSortedSetMember', { key, score, member });
    return this.client.zadd(key, score, member);
  }

  public async popSortedSetMembers(key: string, count: number) {
    console.log('Redis popSortedSetMembers', { key, count });
    const rawMembers = await this.client.zpopmin(key, count);
    const members: SortedSetMember[] = [];
    for (let i = 0; i < rawMembers.length; i = i + 2) {
      members.push({ member: rawMembers[i], score: +rawMembers[i + 1] });
    }
    return members;
  }

  public async addSortedSetMembers(key: string, values: (string | number)[]) {
    console.log('Redis addSortedSetMembers', { key, values });
    return this.client.zadd(key, ...values);
  }

  public async getSortedSetMembersCount(key: string) {
    console.log('Redis getSortedSetMembersCount', { key });
    return this.client.zcard(key);
  }

  public async getZrangeByScore(key: string, min = '-inf', max = '+inf') {
    console.log('Redis getZrangeByScore', { key, min, max });
    return this.client.zrangebyscore(key, min, max);
  }

  public async getZscore(key: string, member: string) {
    console.log('Redis getZscore', { key, member });
    return this.client.zscore(key, member);
  }

  public async getZmscores(key: string, members: string[]) {
    console.log('Redis getZmscores', { key, members });
    return this.client.zmscore(key, ...members);
  }

  public async removeRangeByScore(key: string, min: number, max: number) {
    console.log('Redis ZREMRANGEBYSCORE', { key, min, max });
    return this.client.zremrangebyscore(key, min, max);
  }

  public async getZrevRank(key: string, member: string) {
    console.log('Redis getZrevRank', { key, member });
    return this.client.zrevrank(key, member);
  }

  public async getZrevRange(
    key: string,
    withScores?: boolean,
    start = 0,
    stop = 0,
  ) {
    console.log('Redis getZrevRange', { key, withScores, start, stop });
    if (withScores) {
      return this.client.zrevrange(key, start, stop, 'WITHSCORES');
    }
    return this.client.zrevrange(key, start, stop);
  }

  public async getZrange(
    key: string,
    withScores?: boolean,
    start = 0,
    stop = 0,
  ) {
    console.log('Redis getZrange', { key, withScores, start, stop });
    if (withScores) {
      return this.client.zrange(key, start, stop, 'WITHSCORES');
    }
    return this.client.zrange(key, start, stop);
  }

  public async getZcount(key: string, min = '-inf', max = '+inf') {
    console.log('Redis getZcount', { key, min, max });
    return this.client.zcount(key, min, max);
  }

  public async getZcard(key: string) {
    console.log('Redis getZcard', { key });
    return this.client.zcard(key);
  }

  public async scanForKeys({
    match,
    count = 10000,
  }: {
    match: string;
    count?: number;
  }): Promise<string[]> {
    const stream = this.client.scanStream({ match, count });
    const scannedKeysMap: { [key: string]: boolean } = {};
    return new Promise((resolve, reject) => {
      stream.on('data', (keys) => {
        for (const key of keys) {
          if (key) {
            scannedKeysMap[key] = true;
          }
        }
      });
      stream.on('end', function () {
        resolve(Object.keys(scannedKeysMap));
      });
      stream.on('error', function (err) {
        reject(err);
      });
    });
  }

  async lockConcurrentProcessing<T>({
    key,
    ttlInSeconds,
    exec,
  }: {
    key: string;
    ttlInSeconds: number;
    exec: () => Promise<T>;
  }): Promise<T> {
    const lock = await this.setIfNotExists(key, 1, ttlInSeconds);
    if (!lock) {
      throw new Error(`Concurrent processing for key "${key}"`);
    }
    try {
      return await exec();
    } finally {
      try {
        await this.delete(key);
      } catch (error) {
        console.error(`Failed to delete lock for key "${key}":`, { error });
      }
    }
  }

  public async reset() {
    console.log('Redis reset');
    return this.client.flushall();
  }

  public async getDateValue(key: string): Promise<Date | undefined> {
    const value = await this.get(key);
    return value ? new Date(value) : undefined;
  }
}
