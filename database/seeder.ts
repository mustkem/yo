import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { config } from 'dotenv';

import { UserEntity } from '../apps/api-gateway/src/users/users.entity';
import { PasswordEntity } from '../apps/api-gateway/src/auth/passwords.entity';

/*
Data seeder for local env never seed on production
*/

config(); // Load environment variables from .env

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE_NAME,
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  entities: [UserEntity, PasswordEntity],
});

async function seed() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(UserEntity);
    const passwordRepo = AppDataSource.getRepository(PasswordEntity);

    // Step 1: Create user
    const user = userRepo.create({
      username: 'testuser',
      name: 'Test User',
      bio: 'Welcome to Yo',
      avatar: null,
      verified: true,
    });

    const savedUser = await userRepo.save(user);

    // Step 2: Create password entry
    const password = passwordRepo.create({
      userId: savedUser.id,
      password: await bcrypt.hash('admin123', 10),
    });

    await passwordRepo.save(password);

    console.log('✅ Seed complete.  User created.');
    await AppDataSource.destroy();
  } catch (err) {
    console.error('❌ Error during seed:', err);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
