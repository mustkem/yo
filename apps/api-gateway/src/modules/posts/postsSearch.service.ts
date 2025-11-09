import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  PostSearchBody,
  PostSearchResult,
} from './types/postSearchBody.interface';
import { PostEntity } from './posts.entity';

@Injectable()
export default class PostsSearchService {
  index = 'posts';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async indexPost(post: PostEntity) {
    return this.elasticsearchService.index<PostSearchBody>({
      index: this.index,
      id: post.id,
      body: {
        text: post.text,
        authorId: post.author.id,
        id: post.id,
      },
    });
  }

  async search(text: string): Promise<PostSearchResult[]> {
    const result = await this.elasticsearchService.search<PostSearchResult>({
      index: this.index,
      body: {
        query: {
          multi_match: {
            query: text,
            fields: ['text'],
          },
        },
      },
    } as any);
    const hits = result.hits.hits || [];
    return hits.map((item) => item._source);
  }

  async remove(postId: string) {
    await this.elasticsearchService.deleteByQuery({
      index: this.index,
      query: {
        term: {
          id: postId,
        },
      },
    });
  }
}
