import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostEntity } from './posts.entity';
import { PostsService } from './posts.service';
import { LikesModule } from '../likes/likes.module';
import { KafkaModule } from 'libs/kafka/src';
import { PostCacheModule } from './cache/posts.module';
import PostsSearchService from './postsSearch.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    LikesModule,
    KafkaModule,
    PostCacheModule,
    SearchModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsSearchService],
})
export class PostsModule {}
