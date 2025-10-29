import { PostEntity, PostRaw } from '../posts.entity';
import { RedisConnection } from '../../redis/utils/redisConnection';
import { PlainFlatObject } from 'libs/types/plainObject';
import { groupColumns } from 'libs/utils/groupColumns';
import { plainToClass } from 'class-transformer';
import { Inject, Injectable } from '@nestjs/common';
import { RedisDbCacheService } from '../../redis/redisDbCache.service';
import { EntityNotFoundError } from 'apps/api-gateway/src/config/errors';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { HybridCacheWithAll } from '@utils/cache/hybridCacheWithAll';

class PostCache extends HybridCacheWithAll<PostEntity> {
  constructor(
    readonly redisConnection: RedisConnection,
    private readonly dataSource: DataSource,
  ) {
    super({
      namespace: 'Post',
      config: {
        logUsage: false,
        logPerformance: false,
        logDebug: false,
        throttleUsageLog: 1000,
        isEnabled: true,
      } as any,
      lruConfig: { max: 2000 },
      memoryTtl: 60, // 1 minute -> cache cron runs every 10secs
      redisConnection: redisConnection,
      redisTtl: 90, // 90 seconds -> cache cron runs every 10secs
      redisMaterialize: (value) => plainToClass(PostEntity, value as object),
    });
  }

  protected async fetchAll() {
    const rawRows = await this.buildPostsQuery().getRawMany<PlainFlatObject>();
    const { posts, postIds } = await this.buildPostsMap(rawRows);

    return {
      entities: posts,
      ids: postIds,
    };
  }

  protected async fetchSpecific(
    keys: readonly string[],
  ): Promise<Map<string, PostEntity> | null> {
    console.log('PostCache fetchSpecific called with keys:', keys);

    const query = this.buildPostsQuery();

    console.log('Fetching posts with keys:', keys);

    if (keys && keys.length) {
      query.andWhere('post.id IN (:...keys)', { keys });
    }

    console.log('Executing query to fetch posts with keys:', keys);

    const rawRows = await query.getRawMany<PlainFlatObject>();
    const { posts } = await this.buildPostsMap(rawRows);

    return posts;
  }

  private async buildPostsMap(rawRows: PlainFlatObject[]) {
    const postIds = rawRows.map((row) => row.id as string);

    if (postIds.length === 0) {
      return { posts: new Map(), postIds: [] };
    }
    const posts = rawRows.reduce<Map<string, PostEntity>>((items, row) => {
      const groupedRow = groupColumns<{
        post: PostRaw;
      }>(row);

      let post = items.get(groupedRow.post.id);
      if (!post) {
        post = plainToClass(PostEntity, {
          ...groupedRow.post,
        });

        items.set(post.id, post);
      }

      return items;
    }, new Map());

    return {
      posts,
      postIds,
    };
  }

  private buildPostsQuery() {
    return this.dataSource.getRepository(PostEntity).createQueryBuilder('post');
  }
}

@Injectable()
export class PostCacheService {
  private readonly cache: PostCache;

  constructor(
    @Inject(RedisDbCacheService) readonly redisConnection: RedisConnection,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.cache = new PostCache(redisConnection, dataSource);
  }

  /**
   * @deprecated - getAll is not recommended for production use due to performance concerns.
   * @returns
   */
  public async getAll(): Promise<PostEntity[]> {
    return this.cache.getAll();
  }

  public async getOne(id: string): Promise<PostEntity | undefined> {
    console.log('Fetching post with id:', id);

    return this.cache.getOne(id);
  }

  public async getOneOrFail(id: string): Promise<PostEntity> {
    const one = await this.cache.getOne(id);

    if (!one) {
      throw new EntityNotFoundError({ message: 'Post not found' });
    }

    return one;
  }

  public async getMany(keys: string[]): Promise<PostEntity[]> {
    const all = await this.cache.getMany(keys);
    return Array.from(all.hits.values());
  }

  public async recache() {
    return this.cache.recacheAll();
  }
}
