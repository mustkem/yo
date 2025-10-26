import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { HashtagsModule } from './modules/hashtags/hashtags.module';
import { AuthModule } from './modules/auth/auth.module';
import { LikesModule } from './modules/likes/likes.module';

@Module({
  imports: [UsersModule, PostsModule, HashtagsModule, AuthModule, LikesModule],
})
export class ApiModule {}
