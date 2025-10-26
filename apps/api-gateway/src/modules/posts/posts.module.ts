import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostEntity } from './posts.entity';
import { PostsService } from './posts.service';
import { LikesModule } from '../likes/likes.module';
import { KafkaModule } from 'libs/kafka/src';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity]), LikesModule, KafkaModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
