import { getRepositoryToken } from '@nestjs/typeorm';
import { MockLikesRepository } from './likes.repository.mock';
import { MockPostsRepository } from './posts.repository.mock';
import { UserEntity } from '../../users/users.entity';
import { PasswordEntity } from '../../auth/passwords.entity';
import { UserFollowingEntity } from '../../users/user-followings.entity';
import { PostEntity } from '../../posts/posts.entity';
import { LikesEntity } from '../../likes/likes.entity';
import { SessionsEntity } from '../../auth/sessions.entity';

export const MockUsersRepositoryProvider = {
  provide: getRepositoryToken(UserEntity),
  useValue: {
    findOne: jest.fn().mockResolvedValue({
      id: 'test-uuid',
      name: 'John Doe',
      followeeCount: 1,
      followerCount: 1,
      updatedAt: new Date('2020-01-01'),
      createdAt: new Date('2020-01-01'),
      username: 'johndoe',
      verified: true,
      userPassword: new PasswordEntity(),
    }),
  },
};

export const MockUserFollowingsRepositoryProvider = {
  provide: getRepositoryToken(UserFollowingEntity),
  useValue: {},
};

export const MockPostsRepositoryProvider = {
  provide: getRepositoryToken(PostEntity),
  useValue: {
    findOne: jest.fn().mockResolvedValue({
      id: 'mock-post-id',
      text: 'This is a mock post',
      images: ['image1.png', 'image2.png'],
      hashtags: ['#nestjs'],
      mentions: [{ name: 'mustkeem', id: 'user-id' }],
      likeCount: 3,
      repostCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: 'user-id',
        name: 'Mock User',
        username: 'mockuser',
        verified: true,
      } as UserEntity,
      origPost: null,
      replyTo: null,
    }),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

export const MockLikesRepositoryProvider = {
  provide: getRepositoryToken(LikesEntity),
  useClass: MockLikesRepository,
};

export const MockPasswordRepositoryProvider = {
  provide: getRepositoryToken(PasswordEntity),
  useValue: {},
};

export const MockSessionRepositoryProvider = {
  provide: getRepositoryToken(SessionsEntity),
  useValue: {},
};
