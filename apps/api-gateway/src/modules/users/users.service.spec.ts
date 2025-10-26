import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import {
  MockPasswordRepositoryProvider,
  MockSessionRepositoryProvider,
  MockUserFollowingsRepositoryProvider,
  MockUsersRepositoryProvider,
} from '../commons/mocks/mock.providers';
import { AuthService } from '../auth/auth.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockUsersRepositoryProvider,
        MockUserFollowingsRepositoryProvider,
        MockPasswordRepositoryProvider,
        MockSessionRepositoryProvider,
        UsersService,
        AuthService,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
