import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFollowingEntity } from './user-followings.entity';
import { UsersController } from './users.controller';
import { UserEntity } from './users.entity';
import { UsersService } from './users.service';
import { PasswordEntity } from '../auth/passwords.entity';
import { S3Module } from '../aws/s3.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PasswordEntity, UserFollowingEntity]),
    S3Module,
    RedisModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
