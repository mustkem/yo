import { Repository } from 'typeorm';
import { UserEntity } from '../../users/users.entity';
import { PasswordEntity } from '../../auth/passwords.entity';

export class MockUsersRepository extends Repository<UserEntity> {
  async findOne() {
    const mockUser: UserEntity = {
      id: 'test-uuid',
      name: 'John Doe',
      followeeCount: 1,
      followerCount: 1,
      updatedAt: new Date('2020-01-01'),
      createdAt: new Date('2020-01-01'),
      username: 'johndoe',
      verified: true,
      userPassword: new PasswordEntity(),
    };
    return mockUser;
  }
}
