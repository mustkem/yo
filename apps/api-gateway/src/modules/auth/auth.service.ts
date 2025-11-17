import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { PasswordEntity } from './passwords.entity';
import { SessionsEntity } from './sessions.entity';
import { UserEntity } from '../users/users.entity';
import { UsersRepository } from '../users/users.repository';
import { KafkaProducerService } from 'libs/kafka/src/kafka.producer.service';
import { KafkaTopics } from 'libs/kafka/src/kafka.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: UsersRepository,
    @InjectRepository(PasswordEntity)
    private passwordRepo: Repository<PasswordEntity>,
    @InjectRepository(SessionsEntity)
    private sessionRepo: Repository<SessionsEntity>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  public static PASSWORD_SALT_ROUNDS = 10;

  async registerNewUser(params: {
    email: string;
    password: string;
    name?: string;
    avatar?: string;
    bio?: string;
  }): Promise<UserEntity> {
    const email = params.email?.trim();
    const { password, name, avatar, bio } = params;

    if (!email || email.length < 5) {
      throw new BadRequestException('email must be of minimum 5 characters');
    }

    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be of minimum 8 characters');
    }

    if (password.toLowerCase().includes('password')) {
      throw new BadRequestException(
        'Password cannot contain the word password itself',
      );
    }

    const alreadyExists = await this.userRepo.findOne({
      where: { email },
    });

    if (alreadyExists) {
      throw new ConflictException('This account is already exists!');
    }

    const newUser = this.userRepo.create({
      email,
      name,
      avatar,
      bio,
    });

    const savedUser = await this.userRepo.save(newUser);

    await this.createPasswordForNewUser(savedUser.id, password);

    return savedUser;
  }

  async createPasswordForNewUser(
    userId: string,
    password: string,
  ): Promise<PasswordEntity> {
    const existing = await this.passwordRepo.findOne({
      where: { user_id: userId },
    });
    if (existing) {
      throw new UnauthorizedException(
        'This user already has a password, cannot set new password',
      );
    }

    const newPassword = new PasswordEntity();
    newPassword.user_id = userId;
    newPassword.password = await this.passToHash(password);
    return await this.passwordRepo.save(newPassword);
  }

  async createNewSessionLogin(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Account does not exist');
    }
    const userPassword = await this.passwordRepo.findOne({
      where: { user_id: user.id },
    });
    const passMatch = await this.matchPassHash(password, userPassword.password);
    if (!passMatch) {
      throw new UnauthorizedException('Password is wrong');
    }
    const session = new SessionsEntity();
    session.userId = userPassword.user_id;
    const savedSession = await this.sessionRepo.save(session);
    await this.kafkaProducer.produce(
      {
        userId: user.id,
        email: user.email,
        sessionId: savedSession.id,
        loggedInAt: new Date().toISOString(),
      },
      KafkaTopics.UserLoggedIn,
    );
    return savedSession;
  }

  async getUserFromSessionToken(token: string): Promise<UserEntity> {
    const session = await this.sessionRepo.findOne({
      where: { id: token },
      relations: ['user'],
    });
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }
    const user = await session.user;
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private async passToHash(password: string): Promise<string> {
    return hash(password, AuthService.PASSWORD_SALT_ROUNDS);
  }

  private async matchPassHash(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return (await compare(password, hash)) === true;
  }
}
