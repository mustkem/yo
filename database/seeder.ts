import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { config as loadEnv } from 'dotenv';
import { Logger } from '@nestjs/common';

import { UserEntity } from '../apps/api-gateway/src/modules/users/users.entity';
import { PostEntity } from '../apps/api-gateway/src/modules/posts/posts.entity';
import { PasswordEntity } from '../apps/api-gateway/src/modules/auth/passwords.entity';
import { LikesEntity } from '../apps/api-gateway/src/modules/likes/likes.entity';
import { dropDatabase } from './drop';
import { migrateDatabase } from './migrations/migrate';
import { v4 as uuidv4 } from 'uuid';

loadEnv(); // Load .env

const logger = new Logger('Seeder');

const buildDataSource = () =>
  new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_NAME,
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false, // schema comes from migrations
    entities: [UserEntity, PasswordEntity, PostEntity, LikesEntity],
  });

const seedDatabase = async () => {
  const dataSource = buildDataSource();
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(UserEntity);
  const passwordRepo = dataSource.getRepository(PasswordEntity);
  const postRepo = dataSource.getRepository(PostEntity);
  const likesRepo = dataSource.getRepository(LikesEntity);

  // Skip seeding if data already exists (idempotent seed)
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    logger.log('seed skipped: users already exist');
    await dataSource.destroy();
    return;
  }

  const users: UserEntity[] = [];
  const posts: PostEntity[] = [];

  // 🔹 Step 1: Create 5 users and their passwords
  for (let i = 1; i <= 5; i++) {
    const user = userRepo.create({
      id: uuidv4(),
      username: `user${i}`,
      email: `user${i}@example.com`,
      name: `User ${i}`,
      bio: `Bio for user ${i}`,
      avatar: null,
      verified: true,
    });

    const savedUser = await userRepo.save(user);
    users.push(savedUser);

    const password = passwordRepo.create({
      user_id: savedUser.id,
      password: await bcrypt.hash('password123', 10),
    });
    await passwordRepo.save(password);
  }

  // 🔹 Step 2: Each user creates 1 post
  for (const user of users) {
    const post = postRepo.create({
      id: uuidv4(),
      text: `Hello from ${user.username}`,
      images: [],
      hashtags: [],
      mentions: [],
      links: [],
      author: user,
    });
    const savedPost = await postRepo.save(post);
    posts.push(savedPost);
  }

  // 🔹 Step 3: Each user likes every other user's post
  for (const liker of users) {
    for (const post of posts) {
      if (post.author.id !== liker.id) {
        const like = likesRepo.create({
          id: uuidv4(),
          user: liker,
          post: post,
        });
        await likesRepo.save(like);
      }
    }
  }

  await dataSource.destroy();
};

const main = async () => {
  try {
    logger.log('db setup started');
    await dropDatabase();
    await migrateDatabase();

    if (process.env.APP_ENV !== 'test') {
      await seedDatabase();
      logger.log('seed data inserted');
    } else {
      logger.log('seed skipped in test environment');
    }

    logger.log('db setup finished');
  } catch (error) {
    logger.error('db setup failed', error as any);
    process.exit(1);
  }
  process.exit(0);
};

void main();
