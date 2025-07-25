import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import {
  MockPasswordRepositoryProvider,
  MockSessionRepositoryProvider,
  MockUserFollowingsRepositoryProvider,
  MockUsersRepositoryProvider,
} from '../commons/mocks/mock.providers';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        AuthService,
        MockUsersRepositoryProvider,
        MockUserFollowingsRepositoryProvider,
        MockPasswordRepositoryProvider,
        MockSessionRepositoryProvider,
      ],
      controllers: [UsersController],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be return user', async () => {
    const user = await controller.getUserByUserid('test-uuid');
    expect(user).toBeDefined();
    expect(user.id).toBe('test-uuid');
  });
});
