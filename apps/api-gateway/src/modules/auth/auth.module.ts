import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordEntity } from './passwords.entity';
import { SessionsEntity } from './sessions.entity';
import { UserEntity } from '../users/users.entity';
import { KafkaModule } from 'libs/kafka/src';

@Global()
@Module({
  imports: [
    KafkaModule,
    TypeOrmModule.forFeature([
      PasswordEntity,
      SessionsEntity,
      UserEntity,
      PasswordEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
