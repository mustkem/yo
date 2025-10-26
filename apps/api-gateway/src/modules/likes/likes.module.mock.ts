import { Module } from '@nestjs/common';
import { MockLikesRepositoryProvider } from '../commons/mocks/mock.providers';
import { LikesService } from './likes.service';

@Module({
  providers: [MockLikesRepositoryProvider, LikesService],
  exports: [MockLikesRepositoryProvider, LikesService],
})
export class MockLikesModule {}
