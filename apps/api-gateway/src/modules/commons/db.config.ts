import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { UserEntity } from '../users/users.entity';
import { PostEntity } from '../posts/posts.entity';
import { PasswordEntity } from '../auth/passwords.entity';
import { SessionsEntity } from '../auth/sessions.entity';
import { UserFollowingEntity } from '../users/user-followings.entity';
import { LikesEntity } from '../likes/likes.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { migrations } from '../../../../../database/migrations';

export const entities = [
  UserEntity,
  PostEntity,
  PasswordEntity,
  SessionsEntity,
  UserFollowingEntity,
  LikesEntity,
];

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => ({
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: +configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE_NAME'),
    // Schema comes from migrations to avoid destructive sync updates
    synchronize: false,
    migrationsRun: true,
    migrations,
    logger: 'advanced-console',
    logging: 'all',
    namingStrategy: new SnakeNamingStrategy(),
    entities: entities,
  }),
};
