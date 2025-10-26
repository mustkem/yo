import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/users.entity';
import { PostEntity } from '../posts/posts.entity';
import { PasswordEntity } from '../auth/passwords.entity';
import { SessionsEntity } from '../auth/sessions.entity';
import { UserFollowingEntity } from '../users/user-followings.entity';
import { LikesEntity } from '../likes/likes.entity';
import { typeOrmConfig } from './db.config';

/**
 * Database module for production
 */
@Module({
  imports: [TypeOrmModule.forRootAsync(typeOrmConfig)],
})
export class DatabaseModule {}

/**
 * Database module for testing purposes
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      username: 'yooadmin',
      password: 'yoopass',
      database: 'yoodb_test',
      synchronize: true,
      dropSchema: true,
      logger: 'advanced-console',
      logging: 'all',
      entities: [
        UserEntity,
        PostEntity,
        PasswordEntity,
        SessionsEntity,
        UserFollowingEntity,
        LikesEntity,
      ],
    }),
  ],
})
export class TestDbModule {}
