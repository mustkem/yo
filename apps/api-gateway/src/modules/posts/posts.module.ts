import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostEntity } from './posts.entity';
import { PostsService } from './posts.service';
import { LikesModule } from '../likes/likes.module';
import { KafkaModule } from 'libs/kafka/src';
import { PostCacheModule } from './cache/posts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    LikesModule,
    KafkaModule,
    PostCacheModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
