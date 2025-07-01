import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordEntity } from 'src/auth/passwords.entity';
import { SessionsEntity } from 'src/auth/sessions.entity';
import { LikesEntity } from 'src/likes/likes.entity';
import { PostEntity } from 'src/posts/posts.entity';
import { UserFollowingEntity } from 'src/users/user-followings.entity';
import { UserEntity } from 'src/users/users.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

/**
 * Database module for production
 */

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        type: 'mysql',
        host: process.env['DB_HOST'],
        port: +process.env['DB_PORT'],
        username: process.env['DB_USER'],
        password: process.env['DB_PASSWORD'],
        database: process.env['DB_DATABASE_NAME'],
        synchronize: true,
        logger: 'advanced-console',
        logging: 'all',
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          UserEntity,
          PostEntity,
          PasswordEntity,
          SessionsEntity,
          UserFollowingEntity,
          LikesEntity,
        ],
      }),
    }),
  ],
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
