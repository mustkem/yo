import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFollowingEntity } from './user-followings.entity';
import { UserEntity } from './users.entity';
import { UsersRepository } from './users.repository';
import { AuthService } from '../auth/auth.service';
import { s3Client } from '../aws/s3.config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Service } from '../aws/s3.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly s3Service: S3Service,
    @InjectRepository(UserEntity) private userRepo: UsersRepository,
    private authService: AuthService,
    @InjectRepository(UserFollowingEntity)
    private userFollowRepo: Repository<UserFollowingEntity>,
  ) {}
  /**
   * @description find a user with a given username
   * @returns {Promise<UserEntity>} user if found
   */
  public async getUserByUsername(username: string): Promise<UserEntity> {
    return await this.userRepo.findOne({ where: { username } });
  }

  /**
   * @description find a user with a given userid
   * @returns {Promise<UserEntity>} user if found
   */
  public async getUserByUserId(userId: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (user?.avatarKey) {
      const avatarUrl = await this.s3Service.getViewUrl(user.avatarKey);
      return { ...user, avatarUrl };
    }

    return user;
  }

  /**
   * @description create new user with given details
   * @returns {Promise<UserEntity>} user if created
   */
  public async createUser(
    user: Partial<UserEntity>,
    password: string,
  ): Promise<UserEntity> {
    if (user.username.length < 5)
      throw new BadRequestException('Username must be of minimum 5 characters');

    if (password.length < 8)
      throw new BadRequestException('Password must be of minimum 8 characters');

    if (password.toLowerCase().includes('password'))
      throw new BadRequestException(
        'Password cannot contain the word password itself',
      );

    const usernameAlreadyExists = await this.getUserByUsername(user.username);
    if (usernameAlreadyExists)
      throw new ConflictException('This username is already taken!');

    const newUser = await this.userRepo.save(user);

    await this.authService.createPasswordForNewUser(newUser.id, password);

    return newUser;
  }

  /**
   * @description update a user with given details
   * @returns {Promise<UserEntity>} user if updated
   */
  public async updateUser(
    userId: string,
    newUserDetails: Partial<UserEntity>,
  ): Promise<UserEntity> {
    const existingUser = await this.userRepo.findOne({
      where: { id: userId },
    });
    if (!existingUser) {
      return null;
    }
    if (newUserDetails.bio) existingUser.bio = newUserDetails.bio;
    if (newUserDetails.avatar) existingUser.avatar = newUserDetails.avatar;
    if (newUserDetails.name) existingUser.name = newUserDetails.name;
    if (newUserDetails.avatarKey !== undefined) {
      existingUser.avatarKey = newUserDetails.avatarKey;
    }

    return await this.userRepo.save(existingUser);
  }

  /*
  Upload User Avatar
  */
  // Depriciated // check controller for creating signed URL to upload the image and read it
  async uploadUserAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    console.log('test', file);

    const fileExt = file.originalname.split('.').pop();
    const key = `avatars/${userId}-${Date.now()}.${fileExt}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    user.avatar = url;

    await this.userRepo.save(user);
    return { avatar: url };
  }

  /**
   * create a user-user follow pairing
   */
  public async createUserFollowRelation(
    follower: UserEntity,
    followeeId: string,
  ) {
    const followee = await this.getUserByUserId(followeeId);
    if (!followee) {
      throw new NotFoundException('User not found');
    }
    const newFollow = await this.userFollowRepo.save({
      follower,
      followee,
    });
    return newFollow.followee;
  }

  /**
   * delete a user-user follow pairing
   */
  public async deleteUserFollowRelation(
    follower: UserEntity,
    followeeId: string,
  ) {
    const followee = await this.getUserByUserId(followeeId);
    if (!followee) {
      throw new NotFoundException('User not found');
    }
    const follow = await this.userFollowRepo.findOne({
      where: { follower, followee },
    });
    if (follow) {
      await this.userFollowRepo.delete(follow.id);
      // TODO: future: show show that I do not follow them anymore in the response
      return followee;
    } else {
      throw new NotFoundException('No follow relationship found');
    }
  }
}
