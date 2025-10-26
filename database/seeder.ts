import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { config } from 'dotenv';

import { UserEntity } from '../apps/api-gateway/src/modules/users/users.entity';
import { PostEntity } from '../apps/api-gateway/src/modules/posts/posts.entity';
import { PasswordEntity } from 'apps/api-gateway/src/modules/auth/passwords.entity';
import { LikesEntity } from 'apps/api-gateway/src/modules/likes/likes.entity';

config(); // Load .env

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE_NAME,
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: true,
  entities: [UserEntity, PasswordEntity, PostEntity, LikesEntity],
});

async function seed() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(UserEntity);
    const passwordRepo = AppDataSource.getRepository(PasswordEntity);
    const postRepo = AppDataSource.getRepository(PostEntity);
    const likesRepo = AppDataSource.getRepository(LikesEntity);

    const users: UserEntity[] = [];
    const posts: PostEntity[] = [];

    // 🔹 Step 1: Create 5 users and their passwords
    for (let i = 1; i <= 5; i++) {
      const user = userRepo.create({
        username: `user${i}`,
        name: `User ${i}`,
        bio: `Bio for user ${i}`,
        avatar: null,
        verified: true,
      });

      const savedUser = await userRepo.save(user);
      users.push(savedUser);

      const password = passwordRepo.create({
        userId: savedUser.id,
        password: await bcrypt.hash('password123', 10),
      });
      await passwordRepo.save(password);
    }

    // 🔹 Step 2: Each user creates 1 post
    for (const user of users) {
      const post = postRepo.create({
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
            user: liker,
            post: post,
          });
          await likesRepo.save(like);
        }
      }
    }

    console.log('✅ Seed complete. 5 users, 5 posts, mutual likes created.');
    await AppDataSource.destroy();
  } catch (err) {
    console.error('❌ Error during seed:', err);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
