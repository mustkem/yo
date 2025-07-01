import { Module } from '@nestjs/common';
import {
  MockLikesRepositoryProvider,
  MockPasswordRepositoryProvider,
  MockPostsRepositoryProvider,
  MockSessionRepositoryProvider,
  MockUsersRepositoryProvider,
} from '../commons/mocks/mock.providers';
import { RequiredAuthGuard } from '../auth/auth.guard';
import { LikesService } from '../likes/likes.service';
import { AuthService } from '../auth/auth.service';

@Module({
  providers: [
    MockUsersRepositoryProvider,
    MockPostsRepositoryProvider,
    MockLikesRepositoryProvider,
    MockPasswordRepositoryProvider,
    MockSessionRepositoryProvider,
    RequiredAuthGuard,
    LikesService,
    AuthService,
  ],
  exports: [
    MockUsersRepositoryProvider,
    MockPostsRepositoryProvider,
    MockLikesRepositoryProvider,
    MockPasswordRepositoryProvider,
    MockSessionRepositoryProvider,
    RequiredAuthGuard,
    LikesService,
    AuthService,
  ],
})
export class MockPostsModule {}
