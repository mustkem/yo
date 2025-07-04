import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFollowingEntity } from './user-followings.entity';
import { UsersController } from './users.controller';
import { UserEntity } from './users.entity';
import { UsersService } from './users.service';
import { PasswordEntity } from '../auth/passwords.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PasswordEntity, UserFollowingEntity]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
